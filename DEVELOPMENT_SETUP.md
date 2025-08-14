# Configuración de Desarrollo Local - TrueBlue Chat Management

## Requisitos Previos

- Node.js 18+ instalado
- npm o yarn instalado
- Git instalado
- Acceso a los proyectos de Supabase (staging y producción)
- Acceso a los webhooks de n8n

## Configuración Inicial

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

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Development Environment Variables
VITE_SUPABASE_URL=https://tu-proyecto-dev.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_dev
VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=development
VITE_ENVIRONMENT=DEVELOPMENT
VITE_N8N_WEBHOOK_URL=https://tu-webhook-dev.n8n.cloud/webhook/tu-id
```

**⚠️ IMPORTANTE**: 
- NUNCA subas este archivo a Git
- Ya está incluido en `.gitignore`
- Usa valores de desarrollo, no de producción

### 4. Ejecutar en Modo Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## Flujo de Desarrollo

### 1. Crear Nueva Feature
```bash
# Asegúrate de estar en staging y actualizado
git checkout staging
git pull origin staging

# Crea nueva rama para la feature
git checkout -b feature/nombre-feature

# Desarrolla tu feature
# ... código ...

# Haz commits regulares
git add .
git commit -m "feat: descripción de la feature"

# Sube la rama
git push origin feature/nombre-feature
```

### 2. Crear Pull Request
1. Ve a GitHub
2. Crea Pull Request desde `feature/nombre-feature` a `staging`
3. Usa el template proporcionado
4. Solicita revisión de código

### 3. Testing en Staging
- Después del merge a `staging`, se despliega automáticamente
- Testea en la URL de staging
- Verifica que todo funcione correctamente

### 4. Merge a Producción
- Solo después de testing exitoso en staging
- Crea Pull Request desde `staging` a `main`
- Revisión final y merge

## Comandos Útiles

### Desarrollo
```bash
# Ejecutar en modo desarrollo
npm run dev

# Ejecutar build
npm run build

# Ejecutar build para staging
npm run build:staging

# Ejecutar build para producción
npm run build:production

# Preview del build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

### Git
```bash
# Ver estado
git status

# Ver ramas
git branch -a

# Cambiar rama
git checkout nombre-rama

# Crear nueva rama
git checkout -b nueva-rama

# Ver commits recientes
git log --oneline -10

# Ver diferencias
git diff

# Ver historial de una rama
git log --oneline --graph nombre-rama
```

## Troubleshooting

### Problemas Comunes

#### 1. Variables de Entorno No Se Cargan
- Verifica que el archivo `.env.local` existe
- Reinicia el servidor de desarrollo
- Verifica que las variables empiecen con `VITE_`

#### 2. Problemas de CORS con Supabase
- Verifica la configuración de CORS en Supabase
- Asegúrate de que `localhost:5173` esté en la lista de orígenes permitidos

#### 3. Problemas de Build
- Limpia `node_modules` y reinstala: `rm -rf node_modules && npm install`
- Verifica que Node.js sea versión 18+
- Limpia cache de npm: `npm cache clean --force`

#### 4. Problemas de Git
- Verifica el estado: `git status`
- Verifica el remoto: `git remote -v`
- Verifica las ramas: `git branch -a`

## Configuración del Editor

### VS Code (Recomendado)
Extensiones recomendadas:
- TypeScript Importer
- Tailwind CSS IntelliSense
- GitLens
- Prettier
- ESLint

### Configuración de Prettier
Crea `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Seguridad

### Variables de Entorno
- ✅ Usar `.env.local` para desarrollo
- ✅ NUNCA subir `.env` a Git
- ✅ Usar solo `anon_key` de Supabase (nunca `service_role`)
- ✅ Verificar políticas RLS en Supabase

### Desarrollo
- ✅ Usar ramas feature para cambios
- ✅ Hacer commits regulares y descriptivos
- ✅ Revisar código antes de merge
- ✅ Testing obligatorio antes de producción
