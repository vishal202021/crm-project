FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y maven

WORKDIR /app/crm_service
RUN mvn clean package -DskipTests

EXPOSE 8080

CMD java -jar /app/crm_service/target/crm_service-0.0.1-SNAPSHOT.jar