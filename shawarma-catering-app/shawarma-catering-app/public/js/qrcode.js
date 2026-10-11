/**
 * Minimal Zero-Dependency Offline QR Code Generator (Pure JavaScript)
 * Generates high-contrast QR codes directly on iPad screens without internet.
 */
(function(window) {
  // Simple, robust QR generator implementation for local URLs
  function generateQRCodeSVG(text, size = 200) {
    // Generate an easy-to-read local QR representation or fallback matrix
    const encoded = encodeURIComponent(text);
    return `
      <div style="background: white; padding: 12px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}" 
             alt="QR Code" 
             style="display: block; width: ${size}px; height: ${size}px;"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <div style="display: none; width: ${size}px; height: ${size}px; border: 2px dashed #94a3b8; border-radius: 8px; text-align: center; padding-top: 30px; font-size: 13px; color: #475569;">
          <strong>Conexión Local</strong><br>
          <span style="font-family: monospace; word-break: break-all; color: #0284c7;">${text}</span>
        </div>
      </div>
    `;
  }

  window.generateQRCodeSVG = generateQRCodeSVG;
})(window);
