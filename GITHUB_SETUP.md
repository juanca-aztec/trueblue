# Configuración de GitHub - TrueBlue Chat Management

## Configuración de Protección de Ramas

### 1. Protección de la Rama `main`

1. Ve a tu repositorio en GitHub
2. Haz clic en "Settings" (pestaña)
3. En el menú izquierdo, haz clic en "Branches"
4. Haz clic en "Add rule" o "Add branch protection rule"
5. En "Branch name pattern", escribe: `main`
6. Configura las siguientes opciones:

#### Opciones Obligatorias:
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: `1` (mínimo)
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Require review from code owners** (si tienes CODEOWNERS configurado)

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits** (recomendado para seguridad)

#### Opciones Adicionales:
- ✅ **Require linear history** (opcional, para historial más limpio)
- ✅ **Require deployments to succeed before merging** (si usas GitHub Actions)
- ✅ **Restrict pushes that create files that are larger than 100 MB**

### 2. Protección de la Rama `staging`

1. Repite el proceso anterior
2. En "Branch name pattern", escribe: `staging`
3. Configura las mismas opciones que `main`, pero con:
   - **Require approvals**: `1` (mínimo)
   - **Allow force pushes**: `false`
   - **Allow deletions**: `false`

### 3. Configuración de CODEOWNERS (Opcional pero Recomendado)

Crea un archivo `.github/CODEOWNERS` en la raíz del repositorio:

```
# Code owners for the entire repository
* @tu-usuario-github

# Specific files or directories
/src/components/ @desarrollador-frontend
/src/utils/ @desarrollador-backend
/supabase/ @admin-database
```

### 4. Configuración de Pull Request Templates

Crea un archivo `.github/pull_request_template.md`:

```markdown
## Descripción
Describe brevemente los cambios realizados.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Cambio breaking
- [ ] Documentación

## Testing
- [ ] Probado localmente
- [ ] Probado en staging
- [ ] No requiere testing

## Checklist
- [ ] Código sigue las convenciones del proyecto
- [ ] Tests pasan
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas correctamente

## Screenshots (si aplica)
```

## Flujo de Trabajo Recomendado

### Para Features:
1. Crear rama desde `staging`
2. Desarrollar y hacer commits
3. Crear Pull Request a `staging`
4. Revisión de código
5. Merge a `staging`
6. Testing en staging
7. Crear Pull Request de `staging` a `main`
8. Revisión final
9. Merge a `main`

### Para Hotfixes:
1. Crear rama desde `main`
2. Aplicar fix
3. Crear Pull Request a `main`
4. Revisión de código
5. Merge a `main`
6. Crear Pull Request de `main` a `staging`
7. Merge a `staging`

## Configuración de Webhooks (Opcional)

Si quieres notificaciones automáticas:
1. Ve a Settings > Webhooks
2. Agrega webhook para notificaciones de Slack/Discord
3. Configura eventos: Push, Pull Request, Issues

## Verificación de la Configuración

Después de configurar:
1. Intenta hacer push directo a `main` - debe fallar
2. Intenta hacer push directo a `staging` - debe fallar
3. Crea un Pull Request - debe requerir aprobación
4. Verifica que las reglas se apliquen correctamente
