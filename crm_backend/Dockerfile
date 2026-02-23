FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY crm_backend /app

RUN apt-get update && apt-get install -y maven
RUN mvn clean package -DskipTests

EXPOSE 8080

CMD ["java","-jar","target/*.jar"]