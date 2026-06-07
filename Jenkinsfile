pipeline {
    agent {
        kubernetes {
            yamlFile 'agent.yaml'
        }
    }

    environment {
        APP_NAME        = 'tarea-final'
        VERSION_BASE    = '3.0'
        DOCKERHUB_USER  = 'cverdiaz'
        GITHUB_USER     = 'cverdiaz'
        IMAGE_NAME      = "${DOCKERHUB_USER}/${APP_NAME}"
        GHCR_IMAGE_NAME = "ghcr.io/${GITHUB_USER}/${APP_NAME}"
        NAMESPACE       = 'ns-carlos-vera'
        DEPLOYMENT      = 'app-carlos-vera'
    }

    stages {
        stage('install') { // Instala las dependencias del proyecto.
            steps {
                container('node') {
                    sh '''
                        echo "===== INSTALANDO PNPM ====="
                        npx --yes pnpm@11.0.9 --version

                        echo "===== INSTALANDO DEPENDENCIAS ====="
                        npx --yes pnpm@11.0.9 install --frozen-lockfile
                    '''
                }
            }
        }

        stage('test') { // Ejecuta las pruebas unitarias y end-to-end para validar la aplicación.
            steps {
                container('node') {
                    sh '''
                        echo "===== PRUEBAS UNITARIAS ====="
                        npx --yes pnpm@11.0.9 run test

                        echo "===== PRUEBAS END-TO-END ====="
                        npx --yes pnpm@11.0.9 run test:e2e
                    '''
                }
            }
        }

        stage('build') { // Compila la aplicación NestJS y verifica que la carpeta dist se haya generado correctamente.
            steps {
                container('node') {
                    sh '''
                        echo "===== COMPILANDO APLICACIÓN NESTJS ====="
                        npx --yes pnpm@11.0.9 run build

                        echo "===== VERIFICANDO CARPETA DIST ====="
                        ls -la dist
                    '''
                }
            }
        }

        stage('push') {
            steps {
                container('buildkit') {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-credentials',
                            usernameVariable: 'DOCKERHUB_USERNAME',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        ),
                        usernamePassword(
                            credentialsId: 'ghcr-credentials',
                            usernameVariable: 'GHCR_USERNAME',
                            passwordVariable: 'GHCR_TOKEN'
                        )
                    ]) {
                        sh '''
                            echo "===== CONFIGURANDO AUTENTICACIÓN DE REGISTROS ====="

                            set +x

                            mkdir -p "$HOME/.docker"
                            trap 'rm -f "$HOME/.docker/config.json"' EXIT

                            DOCKERHUB_AUTH="$(printf '%s:%s' "$DOCKERHUB_USERNAME" "$DOCKERHUB_TOKEN" | base64 | tr -d '\\n')"
                            GHCR_AUTH="$(printf '%s:%s' "$GHCR_USERNAME" "$GHCR_TOKEN" | base64 | tr -d '\\n')"

                            cat > "$HOME/.docker/config.json" <<JSON
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "$DOCKERHUB_AUTH"
    },
    "ghcr.io": {
      "auth": "$GHCR_AUTH"
    }
  }
}
JSON

                            VERSION_TAG="${VERSION_BASE}.${BUILD_NUMBER}"

                            set -x

                            echo "===== VERSIÓN GENERADA: ${VERSION_TAG} ====="
                            echo "===== CONSTRUYENDO Y PUBLICANDO IMAGEN EN DOCKER HUB Y GHCR ====="

                            buildctl-daemonless.sh build \
                              --frontend dockerfile.v0 \
                              --local context=. \
                              --local dockerfile=. \
                              --output "type=image,\"name=docker.io/${IMAGE_NAME}:carlos-vera,docker.io/${IMAGE_NAME}:${VERSION_TAG},${GHCR_IMAGE_NAME}:carlos-vera,${GHCR_IMAGE_NAME}:${VERSION_TAG}\",push=true"

                        '''
                    }
                }
            }
        }

        stage('deploy') { //kubectl aplica entrega.yaml, reinicia el Deployment y espera el rollout status para verificar que el despliegue se haya realizado correctamente.
            steps {
                container('kubectl') {
                    sh '''
                        echo "===== APLICANDO MANIFIESTOS ====="
                        kubectl apply -f entrega-pipeline.yaml

                        echo "===== FORZANDO ACTUALIZACIÓN DEL DEPLOYMENT ====="
                        kubectl rollout restart deployment/${DEPLOYMENT} -n ${NAMESPACE}

                        echo "===== ESPERANDO RESULTADO DEL DESPLIEGUE ====="
                        kubectl rollout status deployment/${DEPLOYMENT} \
                          -n ${NAMESPACE} \
                          --timeout=180s

                        echo "===== PODS RESULTANTES ====="
                        kubectl get pods -n ${NAMESPACE}

                        echo "===== SERVICE ====="
                        kubectl get svc -n ${NAMESPACE}
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finalizado.'
        }

        success {
            echo 'Pipeline ejecutado correctamente.'
        }

        failure {
            echo 'El pipeline presentó un error. Revisar el log del stage fallido.'
        }
    }
}
