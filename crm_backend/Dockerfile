FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y maven

RUN cd crm_backend && mvn clean package -DskipTests

EXPOSE 8080

CMD ["java","-jar","crm_backend/target/*.jar"]