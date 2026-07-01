/*
 * Link2Pay — embeddable "Pay with USDC" button.
 *
 * Drop this script on any page and add an element with the data attributes
 * below. The button opens the hosted Link2Pay payment page for a pre-created
 * payment link (CRYPTO or Bre-B off-ramp) in a centered popup. It reuses the
 * existing hosted flow — no API keys, nothing custodial.
 *
 *   <div data-l2p-invoice="INVOICE_ID"
 *        data-l2p-base="https://your-link2pay.app"
 *        data-l2p-label="Pay with USDC"></div>
 *   <script src="https://your-link2pay.app/embed/link2pay-button.js" async></script>
 */
(function () {
  'use strict';

  function openCheckout(url) {
    var w = 460, h = 760;
    var left = window.screenX + (window.outerWidth - w) / 2;
    var top = window.screenY + (window.outerHeight - h) / 2;
    var win = window.open(
      url, 'link2pay-checkout',
      'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',noopener'
    );
    if (!win) window.location.href = url; // popup blocked → navigate
  }

  function render(el) {
    if (el.getAttribute('data-l2p-ready') === '1') return;
    var invoice = el.getAttribute('data-l2p-invoice');
    if (!invoice) return;
    var base = (el.getAttribute('data-l2p-base') || window.location.origin).replace(/\/$/, '');
    var label = el.getAttribute('data-l2p-label') || 'Pay with USDC';
    var url = base + '/pay/' + encodeURIComponent(invoice);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute('aria-label', label);
    btn.style.cssText = [
      'display:inline-flex', 'align-items:center', 'gap:8px',
      'font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'color:#fff', 'background:#3e1bdb', 'border:0', 'border-radius:10px',
      'padding:12px 18px', 'cursor:pointer', 'box-shadow:0 1px 2px rgba(0,0,0,.15)',
    ].join(';');
    btn.onmouseenter = function () { btn.style.background = '#3416b8'; };
    btn.onmouseleave = function () { btn.style.background = '#3e1bdb'; };
    btn.onclick = function () { openCheckout(url); };

    el.appendChild(btn);
    el.setAttribute('data-l2p-ready', '1');
  }

  function init() {
    var nodes = document.querySelectorAll('[data-l2p-invoice]');
    for (var i = 0; i < nodes.length; i++) render(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose a manual hook for SPA/dynamic insertion.
  window.Link2Pay = window.Link2Pay || { render: init };
})();
