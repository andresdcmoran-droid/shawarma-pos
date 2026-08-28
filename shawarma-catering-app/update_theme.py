import re

with open('/Users/leandromoran/.gemini/antigravity/scratch/shawarma-catering-app/public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add CSS for theme-elegant just before </style>
elegant_css = """
    /* ==========================================================================
       MODO ELEGANTE (THEME OVERRIDE)
       ========================================================================== */
    body.theme-elegant {
      --bg-dark: #000000;
      --bg-surface: #0a0a0a;
      --bg-surface-2: #111111;
      --border-color: #1a1a1a;
      
      --text-white: #ffffff;
      --text-dim: #777777;
      
      --yes-green: #ffffff;
      --yes-green-bg: #111111;
      --yes-green-border: #333333;
      
      --no-red: #333333;
      --no-red-bg: #000000;
      --no-red-border: #1a1a1a;
      
      --amber-gold: #aaaaaa;
      --cyan-blue: #aaaaaa;
      
      --radius-sm: 0px;
      --radius-md: 0px;
      --radius-lg: 0px;
      --radius-full: 0px;
    }
    
    body.theme-elegant {
      font-family: "Helvetica Neue", "Inter", sans-serif;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
    
    body.theme-elegant * {
      box-shadow: none !important;
    }
    
    body.theme-elegant .ing-name, 
    body.theme-elegant .protein-title, 
    body.theme-elegant .preset-txt-main,
    body.theme-elegant .btn-submit-pos,
    body.theme-elegant .turn-column-header,
    body.theme-elegant h2,
    body.theme-elegant h4 {
      font-weight: 400 !important;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    body.theme-elegant .protein-card-btn.selected {
      background: transparent;
      border-color: var(--brand-pink);
    }
    
    body.theme-elegant .preset-pill-btn.active,
    body.theme-elegant .preset-pill-btn.preset-bowl.active,
    body.theme-elegant .preset-pill-btn.preset-ninos.active,
    body.theme-elegant .preset-pill-btn.preset-no-item.active {
      background: transparent;
      border-color: var(--text-white);
    }
    body.theme-elegant .preset-pill-btn.active .preset-txt-main,
    body.theme-elegant .preset-pill-btn.preset-bowl.active .preset-txt-main,
    body.theme-elegant .preset-pill-btn.preset-ninos.active .preset-txt-main,
    body.theme-elegant .preset-pill-btn.preset-no-item.active .preset-txt-main {
      color: var(--text-white);
    }
    
    body.theme-elegant .switch-dual-btn {
      border: 1px solid var(--border-color);
    }

    body.theme-elegant .turn-tile.tile-ready {
      border-color: var(--text-white);
      background: #0a0a0a;
      animation: none;
    }
    body.theme-elegant .turn-tile.tile-ready .turn-tile-num {
      color: var(--text-white);
    }
    body.theme-elegant .col-prep-hdr, body.theme-elegant .col-ready-hdr {
      color: var(--text-white);
    }
    
    /* Emojis Hiding */
    body.theme-elegant .emoji, 
    body.theme-elegant .preset-icon, 
    body.theme-elegant .ing-emoji, 
    body.theme-elegant .protein-emoji {
      display: none !important;
    }
"""
html = html.replace("</style>", elegant_css + "\n  </style>")

# Add Theme Toggle Button to Admin View
toggle_btn_html = """
      <div class="pos-card" style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin-bottom: 12px;">🎨 Apariencia del Sistema</h2>
        <p style="font-size: 14px; color: var(--text-dim); margin-bottom: 16px;">
          Alterna entre el Modo Fiesta (colores, emojis, redondeado) y el Modo Elegante (sobrio, monocromático, minimalista).
        </p>
        <div style="display: flex; gap: 12px;">
          <button style="background: var(--bg-surface-2); color: white; border: 1px solid var(--border-color); padding: 12px 20px; border-radius: var(--radius-md); font-weight: 800; cursor: pointer; flex: 1;" onclick="app.setTheme('fiesta')">
            🎉 Modo Fiesta
          </button>
          <button style="background: #000; color: white; border: 1px solid #333; padding: 12px 20px; font-weight: 400; cursor: pointer; letter-spacing: 1px; flex: 1;" onclick="app.setTheme('elegante')">
            MODO ELEGANTE
          </button>
        </div>
      </div>
"""
html = html.replace('<!-- VIEW 4: ADMIN & REPORTES                                                  -->\n  <!-- ========================================================================= -->\n  <main class="view-content" id="view-admin">\n    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">', 
                    '<!-- VIEW 4: ADMIN & REPORTES                                                  -->\n  <!-- ========================================================================= -->\n  <main class="view-content" id="view-admin">\n    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">\n' + toggle_btn_html)

# Add logic to app init
init_logic = """
        // Initialize Theme
        const savedTheme = localStorage.getItem('shawarma_theme') || 'fiesta';
        this.setTheme(savedTheme, false);
"""
html = html.replace("this.syncData(this.db);", "this.syncData(this.db);\n" + init_logic)

# Add setTheme method
set_theme_method = """
      setTheme(themeName, playSound = true) {
        if (playSound) soundEngine.playClick();
        if (themeName === 'elegante') {
          document.body.classList.add('theme-elegant');
        } else {
          document.body.classList.remove('theme-elegant');
        }
        localStorage.setItem('shawarma_theme', themeName);
      }
"""
html = html.replace("exportCSV() {", set_theme_method + "\n      exportCSV() {")

# Wrap loose emojis in HTML with <span class="emoji">
html = re.sub(r'(<span>)(🔥|✨|🚀|✅|📦|📋|⏳|📥|🔄|📶|📊|📍)(</span>)', r'<span class="emoji">\2</span>', html)
html = re.sub(r'(>)(🔥|✨|🚀|✅|📦|📋|⏳|📥|🔄|📶|📊|📍)( )', r'><span class="emoji">\2</span>\3', html)

# Wrap emojis in JS string literals
html = html.replace("🔥", "<span class=\\\"emoji\\\">🔥</span>")
html = html.replace("✨", "<span class=\\\"emoji\\\">✨</span>")
html = html.replace("🥗 BOWL", "<span class=\\\"emoji\\\">🥗</span> BOWL")
html = html.replace("🌯 SHAWARMA", "<span class=\\\"emoji\\\">🌯</span> SHAWARMA")
html = html.replace("👶 PARA NIÑOS", "<span class=\\\"emoji\\\">👶</span> PARA NIÑOS")
html = html.replace("📍", "<span class=\\\"emoji\\\">📍</span>")
html = html.replace("⛔ NO QUIERE", "<span class=\\\"emoji\\\">⛔</span> NO QUIERE")
html = html.replace("⏱️", "<span class=\\\"emoji\\\">⏱️</span>")
html = html.replace("📥 Pedido", "<span class=\\\"emoji\\\">📥</span> Pedido")
html = html.replace("⭐ Con Todo", "<span class=\\\"emoji\\\">⭐</span> Con Todo")
html = html.replace("🥗 Bowl (Sin Pan)", "<span class=\\\"emoji\\\">🥗</span> Bowl (Sin Pan)")
html = html.replace("🚫 Sin Salsas", "<span class=\\\"emoji\\\">🚫</span> Sin Salsas")
html = html.replace("🍖 Solo Carnes", "<span class=\\\"emoji\\\">🍖</span> Solo Carnes")
html = html.replace("🧅 Sin Cebolla", "<span class=\\\"emoji\\\">🧅</span> Sin Cebolla")
html = html.replace("🥒 Sin Pepinillo", "<span class=\\\"emoji\\\">🥒</span> Sin Pepinillo")
html = html.replace("🍅 Sin Tomate", "<span class=\\\"emoji\\\">🍅</span> Sin Tomate")
html = html.replace("🚫 Sin:", "<span class=\\\"emoji\\\">🚫</span> Sin:")
html = html.replace("🔍 Toca para ver detalle", "<span class=\\\"emoji\\\">🔍</span> Toca para ver detalle")

# Write back
with open('/Users/leandromoran/.gemini/antigravity/scratch/shawarma-catering-app/public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Theme support injected!")
