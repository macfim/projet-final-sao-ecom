pipeline {
  agent any

  environment {
    DOCKERHUB_USER = "aldskfjds"
    DOCKERHUB_CREDS_ID = "dockerhub-credentials"
    TRIVY_IMAGE = "aquasec/trivy:latest"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build + Scan + Push (all services)') {
      steps {
        script {
          def gitTag = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()

          def services = [
            [name: "api-gateway",           dir: "api-gateway"],
            [name: "product-service",       dir: "product-service"],
            [name: "user-service",          dir: "user-service"],
            [name: "order-service",         dir: "order-service"],
            [name: "notification-service",  dir: "notification-service"]
          ]

          withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS_ID}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
            sh """echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin"""

            for (s in services) {
              def imageSha = "${DOCKERHUB_USER}/${s.name}:${gitTag}"
              def imageLatest = "${DOCKERHUB_USER}/${s.name}:latest"

              sh "docker build -t ${imageSha} ./${s.dir}"

              sh """
                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock ${TRIVY_IMAGE} \
                  image --severity CRITICAL --exit-code 1 ${imageSha}
              """

              sh "docker tag ${imageSha} ${imageLatest}"
              sh "docker push ${imageSha}"
              sh "docker push ${imageLatest}"
            }
          }
        }
      }
    }
  }

  post {
    always {
      sh "docker logout || true"
    }
  }
}