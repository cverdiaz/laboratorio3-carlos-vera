# Laboratorio 3 — Pipeline CI/CD con Docker, Kubernetes y Jenkins

## Autor

**Carlos Vera**

## Descripción

Este proyecto implementa una aplicación sencilla desarrollada con NestJS y automatiza su ciclo de integración y despliegue continuo mediante Docker, Kubernetes, Minikube y Jenkins.

El pipeline realiza las siguientes acciones:

1. Instala las dependencias del proyecto.
2. Ejecuta pruebas unitarias y end-to-end.
3. Compila la aplicación NestJS.
4. Construye una imagen Docker multietapa.
5. Publica la imagen en Docker Hub y GitHub Container Registry.
6. Despliega la aplicación en Kubernetes.
7. Verifica que el Deployment finalice correctamente.

La aplicación expone dos endpoints:

| Endpoint | Descripción                                                       |
| -------- | ----------------------------------------------------------------- |
| `/`      | Mensaje principal de la aplicación                                |
| `/lab`   | Variables de configuración inyectadas mediante ConfigMap y Secret |

---

## Requisitos previos

Para ejecutar el laboratorio se requiere:

* WSL2 con Ubuntu.
* Docker Engine instalado dentro de WSL.
* Minikube.
* kubectl.
* Node.js 24.
* npm.
* Git.
* Acceso a Docker Hub.
* Acceso a GitHub Container Registry.
* Jenkins instalado dentro del clúster Kubernetes mediante Helm.
* Plugin Kubernetes configurado en Jenkins.

---

## Estructura principal del proyecto

```text
lab3/
├── .dockerignore
├── Dockerfile
├── Jenkinsfile
├── agent.yaml
├── entrega.yaml
├── entrega-pipeline.yaml
├── jenkins-agent-rbac.yaml
├── pipeline-jenkins.log
├── evidencias/
├── src/
├── test/
├── package.json
├── pnpm-lock.yaml
└── README.md
```

### Archivos relevantes

| Archivo                   | Descripción                                                |
| ------------------------- | ---------------------------------------------------------- |
| `Dockerfile`              | Construcción multietapa de la aplicación NestJS            |
| `.dockerignore`           | Exclusión de archivos innecesarios durante la construcción |
| `entrega.yaml`            | Manifiesto completo para despliegue manual                 |
| `entrega-pipeline.yaml`   | Manifiesto utilizado por Jenkins sin recrear el namespace  |
| `agent.yaml`              | Plantilla del agente Kubernetes efímero de Jenkins         |
| `jenkins-agent-rbac.yaml` | Permisos limitados para el agente Jenkins                  |
| `Jenkinsfile`             | Pipeline CI/CD                                             |
| `pipeline-jenkins.log`    | Log de una ejecución exitosa                               |
| `evidencias/`             | Archivos de comprobación del laboratorio                   |

---

## Instalar dependencias localmente

```bash
npx --yes pnpm@11.0.9 install --frozen-lockfile
```

---

## Ejecutar pruebas localmente

### Pruebas unitarias

```bash
npx --yes pnpm@11.0.9 run test
```

### Pruebas end-to-end

```bash
npx --yes pnpm@11.0.9 run test:e2e
```

### Compilar la aplicación

```bash
npx --yes pnpm@11.0.9 run build
```

---

## Construir manualmente la imagen Docker

```bash
docker build -t laboratorio3-carlos-vera:local .
```

Verificar la imagen:

```bash
docker image ls laboratorio3-carlos-vera
```

Ejecutar un contenedor local:

```bash
docker run --rm \
  --name laboratorio3-carlos-vera-test \
  -p 3000:3000 \
  -e AMBIENTE=desarrollo-docker \
  -e API_KEY=clave-docker-prueba \
  laboratorio3-carlos-vera:local
```

Probar la aplicación:

```bash
curl http://localhost:3000/
curl http://localhost:3000/lab
```

---

## Publicación manual en Docker Hub

Etiquetar la imagen:

```bash
docker tag \
  laboratorio3-carlos-vera:local \
  cverdiaz/tarea-final:carlos-vera
```

Publicar la imagen:

```bash
docker push cverdiaz/tarea-final:carlos-vera
```

---

## Publicación manual en GitHub Container Registry

Etiquetar la imagen:

```bash
docker tag \
  laboratorio3-carlos-vera:local \
  ghcr.io/cverdiaz/tarea-final:carlos-vera
```

Publicar la imagen:

```bash
docker push ghcr.io/cverdiaz/tarea-final:carlos-vera
```

---

## Despliegue manual en Kubernetes

Aplicar el manifiesto completo:

```bash
kubectl apply -f entrega.yaml
```

Esperar el despliegue:

```bash
kubectl rollout status \
  deployment/app-carlos-vera \
  -n ns-carlos-vera \
  --timeout=180s
```

Consultar los recursos:

```bash
kubectl get pods -n ns-carlos-vera
kubectl get deployment -n ns-carlos-vera
kubectl get svc -n ns-carlos-vera
```

---

## Probar la aplicación desplegada

Iniciar un port-forward:

```bash
kubectl port-forward \
  svc/svc-carlos-vera \
  8080:80 \
  -n ns-carlos-vera
```

Desde otra terminal:

```bash
curl http://localhost:8080/
curl http://localhost:8080/lab
```

Respuesta esperada del endpoint principal:

```text
Hello World! - CI/CD actualizado
```

Respuesta esperada de `/lab`:

```json
{
  "AMBIENTE": "kubernetes-local",
  "API_KEY": "api-key-laboratorio3-carlos-vera"
}
```

La clave utilizada es ficticia y se incluye solamente con fines demostrativos.

---

## Pipeline Jenkins

El pipeline está definido en:

```text
Jenkinsfile
```

y utiliza el agente Kubernetes efímero configurado en:

```text
agent.yaml
```

### Etapas del pipeline

| Stage     | Descripción                                        |
| --------- | -------------------------------------------------- |
| `install` | Instala pnpm y las dependencias del proyecto       |
| `test`    | Ejecuta pruebas unitarias y end-to-end             |
| `build`   | Compila la aplicación NestJS                       |
| `push`    | Construye y publica la imagen en Docker Hub y GHCR |
| `deploy`  | Aplica los manifiestos y reinicia el Deployment    |

### Versionamiento automático

El pipeline utiliza la variable global de Jenkins:

```text
BUILD_NUMBER
```

para generar tags dinámicos con el formato:

```text
3.0.<BUILD_NUMBER>
```

Ejemplo para la ejecución número 10:

```text
docker.io/cverdiaz/tarea-final:3.0.10
ghcr.io/cverdiaz/tarea-final:3.0.10
```

Además, cada ejecución actualiza el tag estable:

```text
carlos-vera
```

### Registros utilizados

```text
Docker Hub:
docker.io/cverdiaz/tarea-final

GitHub Container Registry:
ghcr.io/cverdiaz/tarea-final
```

---

## Credenciales requeridas en Jenkins

Las credenciales se administran desde Jenkins y no se incluyen directamente en el repositorio.

| ID de credencial        | Uso                                                  |
| ----------------------- | ---------------------------------------------------- |
| `dockerhub-credentials` | Publicación de imágenes en Docker Hub                |
| `ghcr-credentials`      | Publicación de imágenes en GitHub Container Registry |

No se almacenan contraseñas ni tokens dentro del `Jenkinsfile`.

---

## Agente Kubernetes de Jenkins

El agente temporal incluye tres contenedores principales:

| Contenedor | Función                                            |
| ---------- | -------------------------------------------------- |
| `node`     | Instalar dependencias, ejecutar pruebas y compilar |
| `buildkit` | Construir y publicar la imagen                     |
| `kubectl`  | Desplegar y verificar recursos Kubernetes          |

BuildKit se ejecuta en modo privilegiado únicamente dentro del entorno local de laboratorio con Minikube.

Para un entorno productivo se recomienda evaluar una estrategia con aislamiento reforzado y permisos ajustados al entorno real.

---

## Seguridad y permisos RBAC

El pipeline utiliza la cuenta de servicio:

```text
jenkins-lab3-agent
```

Esta cuenta puede administrar solamente los recursos necesarios dentro del namespace:

```text
ns-carlos-vera
```

No dispone de permisos administrativos sobre el clúster completo.

El manifiesto:

```text
entrega-pipeline.yaml
```

excluye la creación del namespace para que Jenkins respete el principio de mínimo privilegio.

---

## Comandos de evidencia

```bash
kubectl cluster-info
kubectl get nodes
kubectl get pods -n ns-carlos-vera
kubectl get deployment -n ns-carlos-vera
kubectl get svc -n ns-carlos-vera
kubectl logs deployment/app-carlos-vera -n ns-carlos-vera
kubectl exec deployment/app-carlos-vera -n ns-carlos-vera -- printenv
kubectl get configmap config-carlos-vera -n ns-carlos-vera
kubectl get secret secret-carlos-vera -n ns-carlos-vera
```

---

## Evidencias adjuntas

La carpeta:

```text
evidencias/
```

contiene archivos de texto con:

* Información del clúster.
* Nodo Minikube.
* Namespace del laboratorio.
* Pods.
* Deployment.
* Service.
* Logs de la aplicación.
* Variables de entorno.
* ConfigMap.
* Secret.
* Port-forward.
* Respuestas de curl.
* Log exitoso del pipeline Jenkins.
* Evidencia de la actualización automática mediante CI/CD.

---

## Repositorio

```text
https://github.com/cverdiaz/laboratorio3-carlos-vera
```
