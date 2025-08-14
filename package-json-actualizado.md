# 📦 Package.json Actualizado - Scripts de Entorno

## 🔧 Scripts a Agregar

Reemplaza la sección `"scripts"` de tu `package.json` con esto:

```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    
    // ===== NUEVOS SCRIPTS DE ENTORNO =====
    "env:local": "node scripts/setup-env.js local",
    "env:staging": "node scripts/setup-env.js staging",
    "env:production": "node scripts/setup-env.js production",
    "env:auto": "node scripts/setup-env.js",
    "env:check": "cat .env | grep VITE_",
    
    // ===== SCRIPTS DE DESARROLLO =====
    "dev:local": "npm run env:local && npm run dev",
    "dev:staging": "npm run env:staging && npm run dev",
    "dev:production": "npm run env:production && npm run dev",
    
    // ===== SCRIPTS DE BUILD =====
    "build:staging": "npm run env:staging && npm run build",
    "build:production": "npm run env:production && npm run build",
    
    // ===== SCRIPTS DE SUPABASE =====
    "supabase:local": "npm run env:local && supabase status",
    "supabase:staging": "npm run env:staging && supabase status",
    "supabase:production": "npm run env:production && supabase status",
    
    // ===== SCRIPTS DE DESPLIEGUE =====
    "deploy:staging": "npm run build:staging",
    "deploy:production": "npm run build:production",
    
    // ===== SCRIPTS DE VERIFICACIÓN =====
    "check:env": "node -e \"console.log('Entorno actual:', process.env.VITE_ENVIRONMENT || 'No configurado')\"",
    "check:db": "node -e \"console.log('BD URL:', process.env.VITE_SUPABASE_URL || 'No configurado')\""
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@supabase/supabase-js": "^2.53.0",
    "@tanstack/react-query": "^5.56.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.3.0",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-resizable-panels": "^2.1.3",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "^22.5.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.9",
    "globals": "^15.9.0",
    "lovable-tagger": "^1.1.7",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^5.4.1"
  }
}
```

## 🚀 Cómo aplicar esta actualización:

### **PASO 1: Actualizar package.json**
1. Abre tu `package.json`
2. Reemplaza la sección `"scripts"` con la nueva
3. Guarda el archivo

### **PASO 2: Verificar instalación**
```bash
npm install
```

### **PASO 3: Probar scripts**
```bash
# Verificar que funciona
npm run env:local

# Verificar entorno
npm run check:env
```

## 📋 Scripts disponibles después de la actualización:

### **Configuración de entornos:**
- `npm run env:local` - Configurar entorno local
- `npm run env:staging` - Configurar entorno staging
- `npm run env:production` - Configurar entorno producción
- `npm run env:auto` - Configuración automática

### **Desarrollo:**
- `npm run dev:local` - Desarrollar en local
- `npm run dev:staging` - Desarrollar en staging
- `npm run dev:production` - Desarrollar en producción

### **Build:**
- `npm run build:staging` - Build para staging
- `npm run build:production` - Build para producción

### **Verificación:**
- `npm run check:env` - Verificar entorno actual
- `npm run check:db` - Verificar configuración de BD
- `npm run env:check` - Ver todas las variables

---
**Después de esta actualización**, podrás usar comandos como `npm run dev:local` para configurar automáticamente el entorno y ejecutar la aplicación.
