import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import InvestorProspectus from '../src/components/InvestorProspectus';

// Resolve directory paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_HTML_PATH = path.join(__dirname, '../public/prospectus.html');

console.log('🤖 Initializing Prospectus React-to-HTML Static Compiler...');

try {
  // Render the React component to raw static HTML markup
  const renderedMarkup = ReactDOMServer.renderToStaticMarkup(
    React.createElement(InvestorProspectus, {
      onEnterPortal: () => {},
      onEnterAetherVet: () => {},
      onEnterFanStack: () => {},
      onEnterSamTracker: () => {},
    })
  );

  // Wrap the rendered markup in a premium, fully-responsive executive HTML shell
  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sovereign OS — Industrial-Grade Investor Prospectus</title>
  <meta name="description" content="Confidential pre-seed investor prospectus for Sovereign OS, a local-first, bare-metal AI orchestration layer eliminating SaaS API taxes.">
  
  <!-- Modern Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS v4 CDN for on-the-fly execution and extreme high-fidelity styling representation -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            outfit: ['Outfit', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>

  <style>
    /* Custom premium styling overrides */
    body {
      background-color: #0B0E14;
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Slick customized scrollbar matching modern HSL palettes */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #0B0E14;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #334155;
    }

    /* Premium selection color highlighting */
    ::selection {
      background-color: rgba(56, 189, 248, 0.3);
      color: #ffffff;
    }
  </style>

  <script>
    // Client-side interactions mapper to wire the static buttons to standard portal URL routes
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔌 Wiring static CTA buttons to portal routing pathways...');
      
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const text = button.textContent.trim().toLowerCase();
        
        // Check text content of buttons and bind navigation behaviors
        if (text.includes('wildseed farm') || text.includes('weedstack farm') || text.includes('live portal')) {
          button.addEventListener('click', () => {
            window.location.href = '/?domain=ROOT';
          });
        } else if (text.includes('fanstack portal')) {
          button.addEventListener('click', () => {
            window.location.href = '/?domain=ROOT&room=fanstack';
          });
        } else if (text.includes('aether vet')) {
          button.addEventListener('click', () => {
            window.location.href = '/?domain=ROOT&room=aethervet';
          });
        } else if (text.includes('samtracker')) {
          button.addEventListener('click', () => {
            window.location.href = '/sam/';
          });
        }
      });
    });
  </script>
</head>
<body class="selection:bg-sky-500/30 selection:text-white">
  
  <!-- Rendered React content -->
  ${renderedMarkup}

</body>
</html>
`;

  // Write compiled HTML to targeted path
  fs.writeFileSync(TARGET_HTML_PATH, htmlDocument, 'utf-8');
  console.log(`✅ Success! Static prospectus compiled and written to: ${TARGET_HTML_PATH}`);
  
} catch (error) {
  console.error('❌ Compilation failed during static render stage:', error);
  process.exit(1);
}
