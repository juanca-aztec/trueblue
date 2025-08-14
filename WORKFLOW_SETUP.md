# Flujo de Trabajo del Equipo - TrueBlue Chat Management

## Estructura de Ramas

- **`main`**: Rama principal para producción
- **`staging`**: Rama para testing y staging
- **`feature/*`**: Ramas para nuevas funcionalidades

## Flujo de Desarrollo

### 1. Desarrollo de Features
```bash
# Crear nueva rama desde staging
git checkout staging
git pull origin staging
git checkout -b feature/nombre-feature

# Desarrollar y hacer commits
git add .
git commit -m "feat: descripción de la feature"

# Subir rama feature
git push origin feature/nombre-feature
```

### 2. Merge a Staging
```bash
# Crear Pull Request desde feature/* a staging
# Revisar código en GitHub
# Aprobar y merge
```

### 3. Testing en Staging
- La rama `staging` se despliega automáticamente a Vercel (Preview)
- URL: `https://tu-app-staging.vercel.app`
- Variables de entorno: Staging (Supabase + n8n)

### 4. Merge a Producción
```bash
# Solo después de testing exitoso en staging
# Crear Pull Request desde staging a main
# Aprobar y merge
```

### 5. Despliegue a Producción
- La rama `main` se despliega automáticamente a Vercel (Production)
- URL: `https://tu-app-prod.vercel.app`
- Variables de entorno: Producción (Supabase + n8n)

## Reglas Importantes

1. **NUNCA** hacer merge directo a `main`
2. **Siempre** pasar por `staging` primero
3. **Testing obligatorio** antes de merge a `main`
4. **Revisión de código** requerida para todos los PRs

## Comandos Útiles

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

# Ver commits recientes
git log --oneline -10
```
