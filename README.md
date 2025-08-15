# TrueBlue Chat Management

Sistema de gestión de chat integrado con Supabase y n8n para automatización de workflows.

## 🚀 Características

- **Chat en tiempo real** con Supabase Realtime
- **Autenticación** integrada con Supabase Auth
- **Automatización** de workflows con n8n
- **Interfaz moderna** construida con React + TypeScript + Tailwind CSS
- **Despliegue automático** con Vercel
- **Entornos separados** para staging y producción

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Automatización**: n8n workflows
- **Despliegue**: Vercel
- **CI/CD**: GitHub + Vercel automático

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- Cuenta en n8n
- Cuenta en Vercel
- Cuenta en GitHub

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/trueblue-chat-management.git
cd trueblue-chat-management
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local`:
```bash
VITE_SUPABASE_URL=https://tu-proyecto-dev.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_dev
VITE_APP_ENV=development
VITE_ENVIRONMENT=DEVELOPMENT
VITE_N8N_WEBHOOK_URL=https://tu-webhook-dev.n8n.cloud/webhook/tu-id
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## 🔄 Flujo de Trabajo del Equipo

### Estructura de Ramas
- **`main`**: Rama principal para producción
- **`staging`**: Rama para testing y staging
- **`feature/*`**: Ramas para nuevas funcionalidades

### Flujo de Desarrollo
1. **Desarrollo**: Crear rama desde `staging`
2. **Testing**: Merge a `staging` y testing en staging
3. **Producción**: Solo después de testing exitoso, merge a `main`

### Comandos Útiles
```bash
# Ver estado actual
git status
git branch -a

# Cambiar entre ramas
git checkout staging
git checkout main

# Sincronizar con remoto
git pull origin staging
git pull origin main
```

## 🚀 Despliegue

### Entornos
- **Staging**: Despliega automáticamente desde rama `staging`
- **Producción**: Despliega automáticamente desde rama `main`

### Variables de Entorno
- **Staging**: Configuradas en Vercel para Preview
- **Producción**: Configuradas en Vercel para Production

## 📚 Documentación

- [Configuración de Desarrollo](./DEVELOPMENT_SETUP.md)
- [Configuración de Producción](./PRODUCTION_SETUP.md)
- [Configuración de Vercel](./VERCEL_SETUP.md)
- [Configuración de GitHub](./GITHUB_SETUP.md)
- [Flujo de Trabajo](./WORKFLOW_SETUP.md)

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting del código
npm run type-check   # Verificación de tipos
```

## 🔒 Seguridad

- ✅ Variables de entorno protegidas
- ✅ Solo `anon_key` de Supabase (nunca `service_role`)
- ✅ Políticas RLS configuradas
- ✅ CORS configurado correctamente
- ✅ Protección de ramas en GitHub

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit de tus cambios: `git commit -m 'feat: nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un Issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación del proyecto

## 🔄 Estado del Proyecto

- **Versión**: 1.1.0
- **Estado**: En desarrollo activo
- **Última actualización**: 2025-01-14
- **Próxima versión**: 1.2.0

  ## �� Testing Deployment
   - Staging deployment test successful.
