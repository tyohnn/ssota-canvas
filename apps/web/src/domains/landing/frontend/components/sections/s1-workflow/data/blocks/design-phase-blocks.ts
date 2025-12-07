/**
 * Design Phase Blocks
 *
 * Phase 1 (Design)의 블록 정의
 * Shadcn UI 컴포넌트들을 보여주는 React Preview 블록들
 */

import type { Node } from '@xyflow/react';

// Common dependencies for Shadcn UI components
const COMMON_SHADCN_DEPENDENCIES = {
  '@radix-ui/react-slot': '^1.0.2',
  'class-variance-authority': '^0.7.0',
  clsx: '^2.1.0',
  'tailwind-merge': '^2.2.0',
  'lucide-react': '^0.344.0',
  tailwindcss: '^3.4.0',
  autoprefixer: '^10.4.16',
};

// Common files to override template defaults
const COMMON_SHADCN_CONFIG_FILES = {
  '/postcss.config.js': {
    code: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
  },
  '/tailwind.config.js': {
    code: `export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
  },
  '/vite.config.ts': {
    code: `import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`,
  },
  '/tsconfig.json': {
    code: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`,
  },
  '/src/index.css': {
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }
}`,
  },
  '/src/lib/utils.ts': {
    code: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
  },
  '/src/components/ui/button.tsx': {
    code: `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };`,
  },
};

// Shadcn Button - Default variant
export const BUTTON_DEFAULT_BLOCK: Node = {
  id: 'design-button-default',
  type: 'react_component',
  position: { x: 100, y: 150 },
  data: {
    blockId: 'design-button-default',
    blockMountId: 'design-button-default',
    blockType: 'react_component',
    title: 'Button - Default',
    properties: {
      template: 'vite-react-ts',
      dependencies: COMMON_SHADCN_DEPENDENCIES,
      files: {
        ...COMMON_SHADCN_CONFIG_FILES,
        '/App.tsx': {
          code: `import React from 'react';
import '/src/index.css';
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function App() {
  return (
    <div style={{
      padding: '3rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
          Default Button
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Primary action button with hover effect
        </p>
      </div>
      
      <Button>Click me</Button>
      <Button size="lg">
        <Mail className="mr-2 h-4 w-4" />
        Send Email
      </Button>
      <Button size="sm">Small Button</Button>
    </div>
  );
}`,
        },
      },
    },
    customProperties: [],
  },
  width: 600,
  height: 500,
};

// Shadcn Button - Outline variant
export const BUTTON_OUTLINE_BLOCK: Node = {
  id: 'design-button-outline',
  type: 'react_component',
  position: { x: 800, y: 150 },
  data: {
    blockId: 'design-button-outline',
    blockMountId: 'design-button-outline',
    blockType: 'react_component',
    title: 'Button - Outline',
    properties: {
      template: 'vite-react-ts',
      dependencies: COMMON_SHADCN_DEPENDENCIES,
      files: {
        ...COMMON_SHADCN_CONFIG_FILES,
        '/App.tsx': {
          code: `import React from 'react';
import '/src/index.css';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function App() {
  return (
    <div style={{
      padding: '3rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #fefce8, #fef3c7)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#713f12' }}>
          Outline Button
        </h1>
        <p style={{ color: '#a16207', fontSize: '0.95rem' }}>
          Secondary action with border style
        </p>
      </div>
      
      <Button variant="outline">Click me</Button>
      <Button variant="outline" size="lg">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="outline" size="sm">Small Outline</Button>
    </div>
  );
}`,
        },
      },
    },
    customProperties: [],
  },
  width: 600,
  height: 500,
};

// Shadcn Button - Destructive variant
export const BUTTON_DESTRUCTIVE_BLOCK: Node = {
  id: 'design-button-destructive',
  type: 'react_component',
  position: { x: 1500, y: 150 },
  data: {
    blockId: 'design-button-destructive',
    blockMountId: 'design-button-destructive',
    blockType: 'react_component',
    title: 'Button - Destructive',
    properties: {
      template: 'vite-react-ts',
      dependencies: COMMON_SHADCN_DEPENDENCIES,
      files: {
        ...COMMON_SHADCN_CONFIG_FILES,
        '/App.tsx': {
          code: `import React from 'react';
import '/src/index.css';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function App() {
  return (
    <div style={{
      padding: '3rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #fef2f2, #fee2e2)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#7f1d1d' }}>
          Destructive Button
        </h1>
        <p style={{ color: '#b91c1c', fontSize: '0.95rem' }}>
          Dangerous action with warning color
        </p>
      </div>
      
      <Button variant="destructive">Delete</Button>
      <Button variant="destructive" size="lg">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Forever
      </Button>
      <Button variant="destructive" size="sm">Remove</Button>
    </div>
  );
}`,
        },
      },
    },
    customProperties: [],
  },
  width: 600,
  height: 500,
};

// Shadcn Form with Buttons
export const FORM_WITH_BUTTONS_BLOCK: Node = {
  id: 'design-form-buttons',
  type: 'react_component',
  position: { x: 750, y: 750 },
  data: {
    blockId: 'design-form-buttons',
    blockMountId: 'design-form-buttons',
    blockType: 'react_component',
    title: 'Form with Buttons',
    properties: {
      template: 'vite-react-ts',
      dependencies: COMMON_SHADCN_DEPENDENCIES,
      files: {
        ...COMMON_SHADCN_CONFIG_FILES,
        '/App.tsx': {
          code: `import React, { useState } from 'react';
import '/src/index.css';
import { Button } from "@/components/ui/button";
import { Save, X, Trash2 } from "lucide-react";

export default function App() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', message: '' });
  };

  const handleDelete = () => {
    handleReset();
    alert('Form cleared!');
  };

  return (
    <div style={{
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', color: '#0f172a' }}>
          Contact Form
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Form with all button variants
        </p>

        {submitted && (
          <div style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            Form submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Submit
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}`,
        },
      },
    },
    customProperties: [],
  },
  width: 700,
  height: 600,
};

// Export all blocks as a sequence
export const DESIGN_PHASE_BLOCKS_SEQUENCE = [
  BUTTON_DEFAULT_BLOCK,
  BUTTON_OUTLINE_BLOCK,
  BUTTON_DESTRUCTIVE_BLOCK,
  FORM_WITH_BUTTONS_BLOCK,
];
