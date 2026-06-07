pipeline {
    agent {
        kubernetes {
            yamlFile 'agent.yaml'
        }
    }

    environment {
        APP_NAME       = 'tarea-final'
        APP_VERSION    = '3.0.0'
        DOCKERHUB_USER = 'cverdiaz'
        IMAGE_NAME     = "${DOCKERHUB_USER}/${APP_NAME}"
        NAMESPACE      = 'ns-carlos-vera'
        DEPLOYMENT     = 'app-carlos-vera'
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

        stage('push') { // BuildKit construye la imagen Docker y publica ambos tags en Docker Hub: el específico de versión estable el tag personalizado carlos-vera y el tag de versión 3.0.0
            steps {
                container('buildkit') {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-credentials',
                            usernameVariable: 'DOCKERHUB_USERNAME',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        )
                    ]) {
                        sh '''
                            echo "===== CONFIGURANDO AUTENTICACIÓN DOCKER HUB ====="
                            mkdir -p "$HOME/.docker"

                            AUTH="$(printf '%s:%s' "$DOCKERHUB_USERNAME" "$DOCKERHUB_TOKEN" | base64 | tr -d '\\n')"

                            cat > "$HOME/.docker/config.json" <<JSON
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "$AUTH"
    }
  }
}
JSON

                            echo "===== CONSTRUYENDO Y PUBLICANDO IMAGEN ====="
                            buildctl-daemonless.sh build \
                              --frontend dockerfile.v0 \
                              --local context=. \
                              --local dockerfile=. \
                              --output "type=image,\"name=docker.io/${IMAGE_NAME}:carlos-vera,docker.io/${IMAGE_NAME}:${APP_VERSION}\",push=true"

                            rm -f "$HOME/.docker/config.json"
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
