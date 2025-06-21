// HTML Style Templates for different design approaches

export const getHtmlStyle = (styleCode) => {
  const styles = {
    modern: {
      name: 'Modern Minimal',
      css: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1d1d1f;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 0;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            position: relative;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
            color: white;
            padding: 48px 40px;
            text-align: center;
            position: relative;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 12px;
        }
        
        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 48px 40px;
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            color: #1d1d1f;
        }
        
        .content h1 { font-size: 2rem; }
        .content h2 { font-size: 1.5rem; }
        .content h3 { font-size: 1.25rem; }
        
        .content p {
            margin-bottom: 1.5rem;
            color: #424245;
        }
        
        .footer {
            text-align: center;
            padding: 40px;
            color: #86868b;
            font-size: 0.9rem;
            border-top: 1px solid #e0e0e0;
        }
      `
    },
    
    classic: {
      name: 'Classic Article',
      css: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.7;
            color: #2c2c2c;
            background: #f8f8f8;
            padding: 20px;
        }
        
        .container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 0;
        }
        
        .header {
            background: #1a1a1a;
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-top: 4px solid #d4af37;
        }
        
        .header h1 {
            font-size: 2.2rem;
            font-weight: 400;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 0.9rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .content {
            padding: 40px 30px;
            font-size: 1.05rem;
            line-height: 1.8;
            text-align: justify;
        }
        
        .content h1, .content h2, .content h3 {
            font-family: 'Georgia', serif;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            color: #1a1a1a;
        }
        
        .content h1 { font-size: 1.8rem; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
        .content h2 { font-size: 1.4rem; }
        .content h3 { font-size: 1.2rem; }
        
        .content p {
            margin-bottom: 1.5rem;
            text-indent: 2em;
        }
        
        .content p:first-of-type {
            text-indent: 0;
            font-weight: 500;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f5f5f5;
            color: #666;
            font-size: 0.85rem;
            border-top: 1px solid #ddd;
        }
      `
    },
    
    magazine: {
      name: 'Magazine Style',
      css: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4d79ff);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            padding: 20px;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .container {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="25" cy="25" r="2" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1.5" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/></svg>');
            animation: float 20s linear infinite;
        }
        
        @keyframes float {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 300;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 50px 40px;
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .content h1, .content h2, .content h3 {
            margin-top: 2.5rem;
            margin-bottom: 1.2rem;
            color: #2c3e50;
            position: relative;
        }
        
        .content h1 { 
            font-size: 2.2rem; 
            color: #e74c3c;
            border-left: 5px solid #e74c3c;
            padding-left: 20px;
        }
        .content h2 { 
            font-size: 1.6rem; 
            color: #3498db;
        }
        .content h3 { 
            font-size: 1.3rem; 
            color: #27ae60;
        }
        
        .content p {
            margin-bottom: 1.5rem;
            color: #444;
        }
        
        .content p:first-of-type::first-letter {
            font-size: 4em;
            float: left;
            line-height: 1;
            margin: 0 8px 0 0;
            color: #e74c3c;
            font-weight: bold;
        }
        
        .footer {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 40px;
            font-size: 0.9rem;
        }
      `
    },
    
    tech: {
      name: 'Tech Blog',
      css: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            line-height: 1.6;
            color: #e6e6e6;
            background: #0d1117;
            padding: 0;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: #161b22;
            min-height: 100vh;
            border-left: 1px solid #30363d;
            border-right: 1px solid #30363d;
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }
        
        .header {
            background: linear-gradient(135deg, #238636, #2ea043);
            color: white;
            padding: 40px 30px;
            text-align: left;
            border-bottom: 3px solid #39d353;
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 10px;
            font-family: 'SF Mono', Monaco, monospace;
        }
        
        .header .subtitle {
            font-size: 0.9rem;
            opacity: 0.8;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        .content {
            padding: 40px 30px;
            font-size: 1rem;
            line-height: 1.7;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .content h1, .content h2, .content h3 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #f0f6fc;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        .content h1 { 
            font-size: 1.8rem; 
            border-bottom: 2px solid #21262d;
            padding-bottom: 10px;
            color: #58a6ff;
        }
        .content h2 { 
            font-size: 1.4rem; 
            color: #7c3aed;
        }
        .content h3 { 
            font-size: 1.2rem; 
            color: #fbbf24;
        }
        
        .content p {
            margin-bottom: 1.5rem;
            color: #c9d1d9;
        }
        
        .content code {
            background: #21262d;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, monospace;
            color: #79c0ff;
            border: 1px solid #30363d;
        }
        
        .content pre {
            background: #0d1117;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
            border: 1px solid #30363d;
            border-left: 4px solid #58a6ff;
        }
        
        .footer {
            background: #21262d;
            color: #8b949e;
            text-align: center;
            padding: 30px;
            font-size: 0.85rem;
            border-top: 1px solid #30363d;
        }
      `
    },
    
    academic: {
      name: 'Academic Paper',
      css: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.8;
            color: #000;
            background: #fff;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 750px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 30px rgba(0,0,0,0.1);
            border: 1px solid #ddd;
        }
        
        .header {
            background: white;
            color: #000;
            padding: 60px 50px 40px;
            text-align: center;
            border-bottom: 3px double #666;
        }
        
        .header h1 {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header .subtitle {
            font-size: 0.95rem;
            font-style: italic;
            color: #555;
        }
        
        .content {
            padding: 40px 50px;
            font-size: 12pt;
            line-height: 2;
            text-align: justify;
        }
        
        .content h1, .content h2, .content h3 {
            margin-top: 30px;
            margin-bottom: 15px;
            color: #000;
            text-align: left;
        }
        
        .content h1 { 
            font-size: 14pt; 
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
        }
        .content h2 { 
            font-size: 13pt; 
            font-weight: bold;
        }
        .content h3 { 
            font-size: 12pt; 
            font-weight: bold;
            font-style: italic;
        }
        
        .content p {
            margin-bottom: 15pt;
            text-indent: 0.5in;
        }
        
        .content p:first-of-type {
            text-indent: 0;
        }
        
        .content blockquote {
            margin: 20px 40px;
            padding: 10px 20px;
            border-left: 3px solid #ccc;
            font-style: italic;
            background: #f9f9f9;
        }
        
        .footer {
            text-align: center;
            padding: 30px 50px;
            color: #666;
            font-size: 10pt;
            border-top: 1px solid #ddd;
            font-style: italic;
        }
      `
    },
    
    creative: {
      name: 'Creative Portfolio',
      css: `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2c2c2c;
            background: #000;
            overflow-x: hidden;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #ec4899 75%, #f97316 100%);
            background-size: 400% 400%;
            animation: creativeGradient 10s ease infinite;
            min-height: 100vh;
            position: relative;
        }
        
        @keyframes creativeGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .header {
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 80px 40px;
            text-align: center;
            position: relative;
            backdrop-filter: blur(10px);
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="white" opacity="0.03"/></svg>');
            background-size: 100px 100px;
        }
        
        .header h1 {
            font-size: 3.5rem;
            font-weight: 100;
            margin-bottom: 20px;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
            position: relative;
            z-index: 1;
            transform: perspective(500px) rotateX(15deg);
        }
        
        .header .subtitle {
            font-size: 1.3rem;
            opacity: 0.9;
            font-weight: 300;
            position: relative;
            z-index: 1;
            letter-spacing: 3px;
        }
        
        .content {
            background: rgba(255,255,255,0.95);
            margin: 20px;
            padding: 60px 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .content h1, .content h2, .content h3 {
            margin-top: 2.5rem;
            margin-bottom: 1.5rem;
            position: relative;
        }
        
        .content h1 { 
            font-size: 2.5rem; 
            color: #e91e63;
            text-align: center;
            margin-bottom: 2rem;
        }
        .content h2 { 
            font-size: 1.8rem; 
            color: #9c27b0;
            border-left: 5px solid #9c27b0;
            padding-left: 20px;
        }
        .content h3 { 
            font-size: 1.4rem; 
            color: #673ab7;
        }
        
        .content p {
            margin-bottom: 1.8rem;
            color: #444;
        }
        
        .content p:nth-child(even) {
            padding-left: 20px;
            border-left: 3px solid rgba(233, 30, 99, 0.3);
        }
        
        .footer {
            background: rgba(0,0,0,0.9);
            color: white;
            text-align: center;
            padding: 40px;
            font-size: 0.9rem;
            margin: 20px;
            border-radius: 0 0 20px 20px;
            backdrop-filter: blur(10px);
        }
      `
    }
  };

  return styles[styleCode] || styles.modern;
};

export const getAllHtmlStyles = () => {
  return Object.keys({
    modern: true,
    classic: true, 
    magazine: true,
    tech: true,
    academic: true,
    creative: true
  }).map(code => ({
    code,
    ...getHtmlStyle(code)
  }));
};