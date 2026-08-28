#!/usr/bin/env ruby
# frozen_string_literal: true

$stdout.sync = true
$stderr.sync = true

require 'webrick'
require 'json'
require 'socket'
require 'fileutils'
require 'time'

PORT = (ENV['PORT'] || 8080).to_i
DATA_DIR = File.expand_path('data', __dir__)
DATA_FILE = File.join(DATA_DIR, 'catering_event.json')
PUBLIC_DIR = File.expand_path('public', __dir__)

FileUtils.mkdir_p(DATA_DIR)
FileUtils.mkdir_p(PUBLIC_DIR)

# Mutex for thread-safe operations
$db_mutex = Mutex.new
$clients = []
$clients_mutex = Mutex.new

def get_local_ip
  ip = 'localhost'
  begin
    # Create a dummy socket to find local LAN IP
    dummy = UDPSocket.new
    dummy.connect('8.8.8.8', 1)
    ip = dummy.addr_last[3]
    dummy.close
  rescue StandardError
    begin
      ip = Socket.ip_address_list.find { |ai| ai.ipv4? && !ai.ipv4_loopback? }&.ip_address || 'localhost'
    rescue StandardError
      ip = 'localhost'
    end
  end
  ip
end

def default_db_state
  {
    'event_info' => {
      'id' => "evt_#{Time.now.to_i}",
      'name' => 'Catering Evento Especial',
      'created_at' => Time.now.iso8601,
      'turn_counter' => 0
    },
    'orders' => []
  }
end

def load_db
  $db_mutex.synchronize do
    if File.exist?(DATA_FILE)
      begin
        JSON.parse(File.read(DATA_FILE))
      rescue StandardError => e
        puts "[DB WARN] Corrupt file, reinitializing: #{e.message}"
        default_db_state
      end
    else
      initial = default_db_state
      File.write(DATA_FILE, JSON.pretty_generate(initial))
      initial
    end
  end
end

def save_db(data)
  $db_mutex.synchronize do
    File.write(DATA_FILE, JSON.pretty_generate(data))
  end
  broadcast_event('sync', data)
end

def broadcast_event(event_type, payload)
  $clients_mutex.synchronize do
    $clients.reject! do |client|
      begin
        client.write("event: #{event_type}\n")
        client.write("data: #{JSON.generate(payload)}\n\n")
        client.flush
        false
      rescue StandardError
        true # Remove dead client
      end
    end
  end
end

# Create WEBrick Server
server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: PUBLIC_DIR,
  BindAddress: '0.0.0.0',
  Logger: WEBrick::Log.new(nil, WEBrick::Log::WARN),
  AccessLog: []
)

# Enable CORS and disable caching for API
def set_api_headers(res)
  res['Content-Type'] = 'application/json; charset=utf-8'
  res['Access-Control-Allow-Origin'] = '*'
  res['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  res['Cache-Control'] = 'no-cache, no-store, must-revalidate'
end

# API: IP / Network Info
server.mount_proc '/api/info' do |req, res|
  if req.request_method == 'OPTIONS'
    set_api_headers(res)
    res.status = 204
    next
  end
  set_api_headers(res)
  local_ip = get_local_ip
  res.body = JSON.generate({
    status: 'ok',
    local_ip: local_ip,
    port: PORT,
    urls: {
      kiosk: "http://#{local_ip}:#{PORT}/?view=order",
      kitchen: "http://#{local_ip}:#{PORT}/?view=kitchen",
      display: "http://#{local_ip}:#{PORT}/?view=display",
      admin: "http://#{local_ip}:#{PORT}/?view=admin"
    }
  })
end

# API: Get DB State (Orders + Event Info)
server.mount_proc '/api/orders' do |req, res|
  set_api_headers(res)

  if req.request_method == 'OPTIONS'
    res.status = 204
    next
  end

  db = load_db

  if req.request_method == 'GET'
    res.body = JSON.generate(db)
  elsif req.request_method == 'POST'
    begin
      body = JSON.parse(req.body)
      
      # Increment turn counter
      turn_num = (db['event_info']['turn_counter'] || 0) + 1
      db['event_info']['turn_counter'] = turn_num

      new_order = {
        'id' => "ord_#{Time.now.to_f.to_s.sub('.', '')}",
        'turn' => turn_num,
        'guest_name' => (body['guest_name'] || 'Invitado').strip,
        'table' => (body['table'] || '').strip,
        'protein' => body['protein'] || 'Pollo',
        'preset' => body['preset'] || 'Personalizado',
        'ingredients' => body['ingredients'] || [],
        'removed_ingredients' => body['removed_ingredients'] || [],
        'added_extras' => body['added_extras'] || [],
        'notes' => (body['notes'] || '').strip,
        'quantity' => (body['quantity'] || 1).to_i,
        'status' => 'pending', # pending -> preparing -> ready -> delivered -> cancelled
        'created_at' => Time.now.iso8601,
        'updated_at' => Time.now.iso8601
      }

      db['orders'] << new_order
      save_db(db)

      res.status = 201
      res.body = JSON.generate({ status: 'created', order: new_order })
    rescue StandardError => e
      res.status = 400
      res.body = JSON.generate({ error: e.message })
    end
  end
end

# API: Update Order Status
server.mount_proc '/api/orders/status' do |req, res|
  set_api_headers(res)

  if req.request_method == 'OPTIONS'
    res.status = 204
    next
  end

  if req.request_method == 'POST' || req.request_method == 'PATCH'
    begin
      body = JSON.parse(req.body)
      order_id = body['id']
      new_status = body['status']

      db = load_db
      order = db['orders'].find { |o| o['id'] == order_id }

      if order
        order['status'] = new_status
        order['updated_at'] = Time.now.iso8601
        order['prepared_at'] = Time.now.iso8601 if new_status == 'ready'
        order['delivered_at'] = Time.now.iso8601 if new_status == 'delivered'
        save_db(db)

        res.body = JSON.generate({ status: 'ok', order: order })
      else
        res.status = 404
        res.body = JSON.generate({ error: 'Order not found' })
      end
    rescue StandardError => e
      res.status = 400
      res.body = JSON.generate({ error: e.message })
    end
  end
end

# API: Customer Ack Coming to Pick Up
server.mount_proc '/api/orders/ack' do |req, res|
  set_api_headers(res)

  if req.request_method == 'OPTIONS'
    res.status = 204
    next
  end

  if req.request_method == 'POST'
    begin
      body = JSON.parse(req.body)
      order_id = body['id']

      db = load_db
      order = db['orders'].find { |o| o['id'] == order_id || o['turn'].to_s == order_id.to_s }

      if order
        order['guest_ack'] = true
        order['guest_ack_at'] = Time.now.iso8601
        order['updated_at'] = Time.now.iso8601
        save_db(db)

        res.body = JSON.generate({ status: 'ok', order: order })
      else
        res.status = 404
        res.body = JSON.generate({ error: 'Order not found' })
      end
    rescue StandardError => e
      res.status = 400
      res.body = JSON.generate({ error: e.message })
    end
  end
end
server.mount_proc '/api/event/reset' do |req, res|
  set_api_headers(res)

  if req.request_method == 'OPTIONS'
    res.status = 204
    next
  end

  if req.request_method == 'POST'
    begin
      body = JSON.parse(req.body || '{}')
      event_name = body['name'] || "Evento #{Time.now.strftime('%d/%m/%Y %H:%M')}"

      # Backup previous event if it had orders
      current_db = load_db
      if current_db['orders'].any?
        backup_file = File.join(DATA_DIR, "backup_#{current_db['event_info']['id']}.json")
        File.write(backup_file, JSON.pretty_generate(current_db))
      end

      new_db = {
        'event_info' => {
          'id' => "evt_#{Time.now.to_i}",
          'name' => event_name,
          'created_at' => Time.now.iso8601,
          'turn_counter' => 0
        },
        'orders' => []
      }

      save_db(new_db)
      res.body = JSON.generate({ status: 'reset_ok', data: new_db })
    rescue StandardError => e
      res.status = 400
      res.body = JSON.generate({ error: e.message })
    end
  end
end

# API: Server-Sent Events (SSE) for Real-Time Sync without external internet
server.mount_proc '/api/stream' do |req, res|
  res['Content-Type'] = 'text/event-stream'
  res['Cache-Control'] = 'no-cache'
  res['Connection'] = 'keep-alive'
  res['Access-Control-Allow-Origin'] = '*'

  # Keep connection open for SSE streaming
  res.chunked = true
  rd, wr = IO.pipe
  res.body = rd

  $clients_mutex.synchronize do
    $clients << wr
  end

  # Send immediate current state
  begin
    wr.write("event: init\n")
    wr.write("data: #{JSON.generate(load_db)}\n\n")
    wr.flush
  rescue StandardError
    # Client disconnected immediately
  end
end

# Static Files and Route Handlers
server.mount_proc '/' do |req, res|
  path = req.path
  # Normalize path
  path = '/index.html' if path == '/' || ['/order', '/kitchen', '/display', '/admin'].include?(path)
  
  target_file = File.join(PUBLIC_DIR, path)

  if File.file?(target_file)
    ext = File.extname(target_file).downcase
    mime_types = {
      '.html' => 'text/html; charset=utf-8',
      '.css' => 'text/css; charset=utf-8',
      '.js' => 'application/javascript; charset=utf-8',
      '.json' => 'application/json; charset=utf-8',
      '.png' => 'image/png',
      '.jpg' => 'image/jpeg',
      '.jpeg' => 'image/jpeg',
      '.svg' => 'image/svg+xml',
      '.ico' => 'image/x-icon'
    }
    res['Content-Type'] = mime_types[ext] || 'application/octet-stream'
    res['Cache-Control'] = 'public, max-age=3600'
    res.body = File.binread(target_file)
  else
    # Fallback to index.html for SPA routes
    res.status = 200
    res['Content-Type'] = 'text/html; charset=utf-8'
    res.body = File.read(File.join(PUBLIC_DIR, 'index.html'))
  end
end

# Trap Ctrl-C
trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }

local_ip = get_local_ip
puts "=========================================================="
puts "  🌯 SHAWARMA CATERING KIOSK & KDS - OFFLINE SERVER 🌯"
puts "=========================================================="
puts "  Red Local (Cero Internet Requerido):"
puts "  - En este Mac:       http://localhost:#{PORT}"
puts "  - En tus iPads:      http://#{local_ip}:#{PORT}"
puts ""
puts "  Acceso Rápido:"
puts "  - 📱 iPad Mesero:     http://#{local_ip}:#{PORT}/?view=order"
puts "  - 👨‍🍳 iPad Cocina:     http://#{local_ip}:#{PORT}/?view=kitchen"
puts "  - 📺 Monitor Turnos:  http://#{local_ip}:#{PORT}/?view=display"
puts "  - ⚙️  Administración: http://#{local_ip}:#{PORT}/?view=admin"
puts "=========================================================="

server.start
