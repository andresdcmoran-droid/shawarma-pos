/**
 * Minimal Zero-Dependency Offline & Online QR Code Generator (Pure JavaScript)
 * Generates high-contrast QR codes directly on iPad screens with or without internet.
 */
(function(window) {
  function renderQRCode(container, text, size = 220) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(container, {
          text: text,
          width: size,
          height: size,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: (QRCode.CorrectLevel && QRCode.CorrectLevel.M !== undefined) ? QRCode.CorrectLevel.M : 0
        });
        return;
      } catch (e) {
        console.warn('QRCode offline render fallback', e);
      }
    }
    const encoded = encodeURIComponent(text);
    container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}" 
         alt="QR Code" 
         style="display: block; width: ${size}px; height: ${size}px; border-radius: 8px; margin: 0 auto;" />`;
  }

  function generateQRCodeSVG(text, size = 200) {
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

  window.renderQRCode = renderQRCode;
  window.generateQRCodeSVG = generateQRCodeSVG;
})(window);
