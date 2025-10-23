export const codeContent = {
    maven: `<!-- pom.xml -->
<dependencies>
    <!-- The core runtime library -->
    <dependency>
        <groupId>com.eliasmshallouf</groupId>
        <artifactId>orm-core</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <annotationProcessorPaths>
                    <path>
                        <groupId>com.eliasmshallouf</groupId>
                        <artifactId>annotation-processor</artifactId>
                        <version>1.0.0</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>`,
    gradle: `// build.gradle
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    // The core runtime library
    implementation 'com.eliasmshallouf:orm-core:1.0.0'
    
    // The compile-time annotation processor
    annotationProcessor 'com.eliasmshallouf:annotation-processor:1.0.0'

    // or for local jars
    implementation files('lib/orm-core.jar')
    annotationProcessor files('lib/annotation-processor.jar')
}`,
    config: `// In your Spring @Configuration or @SpringBootApplication class
import com.eliasmshallouf.orm.ConnectionManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@Bean
public ConnectionManager createConnectionManager(
    @Value("$\{spring.datasource.driver-class-name}") String driver,
    @Value("$\{spring.datasource.url}") String url,
    @Value("$\{spring.datasource.username}") String user,
    @Value("$\{spring.datasource.password}") String password
) {
    // You can also set a logger here, e.g., ConnectionManager.setLogger(Logger.defaultLogger);
    return new ConnectionManager(driver, url, user, password);
}`,
    entity: `// User.java
package com.example.model;

import com.eliasmshallouf.orm.annotations.Column;
import com.eliasmshallouf.orm.annotations.Entity;
import com.eliasmshallouf.orm.annotations.Id;

@Entity
public class User {
    @Id 
    private long id;
    
    @Column 
    private String name;
    
    @Column 
    private String email;
    
    // Getters and setters...
}`,
    employeeEntity: `package com.example.model;
import com.eliasmshallouf.orm.annotations.*;
import java.io.Serializable;
import java.util.Date;

@Entity
public class Employee implements Serializable {
    @Id 
    Long employeeId;
    
    @Column(name = "lastname") 
    String lastName;
    
    @Column(name = "firstname") 
    String firstName;
    
    @Column 
    String title;
    
    @Column 
    Date hireDate;
    
    @Lob 
    byte[] photo;
    
    // ... other fields ...
}`,
    employeeTable: `package com.example.model.orm;

import com.example.model.Employee;
import com.eliasmshallouf.orm.table.EntityModel;
import com.eliasmshallouf.orm.table.TableColumns;
import com.eliasmshallouf.orm.columns.*;
import java.time.LocalDateTime;

public class EmployeeTable extends EntityModel<Employee, Long> {
	
    public static class Columns extends TableColumns<Employee> {
		public final NumericColumn<Long> employeeId = new NumericColumn<>(this, "employeeId");
		public final TextColumn lastName = new TextColumn(this, "lastname");
		public final TextColumn firstName = new TextColumn(this, "firstname");
		public final DateColumn<LocalDateTime> hireDate = new DateColumn<>(this, "hireDate");
		public final BlobColumn photo = new BlobColumn(this, "photo");
		// ...
		public Columns(EmployeeTable model) { super(model); }
	}

    private final Columns columns = new Columns(this);

    public EmployeeTable() {
        super(Employee.class, "Employee");
        setIdField(employeeId().id());
    }

    @Override
    public Columns columns() { return columns; }

	public NumericColumn<Long> employeeId() { return columns.employeeId; }
	public TextColumn lastName() { return columns.lastName; }
	public TextColumn firstName() { return columns.firstName; }
	public DateColumn<LocalDateTime> hireDate() { return columns.hireDate; }
	public BlobColumn photo() { return columns.photo; }
	// ...
}`,
    helloEntity: `// Hello.java - entity class

@Entity
public class Hello {
    @Id private String a;
    @Id private int b;
    @Column long c;
    @Column LocalDate d;

    // ...
}
`,
    helloTable: `// HelloTable.java - generated class

public class HelloTable extends EntityModel<Hello, HelloTable.HelloTableId> {
	
    // 1. Generated inner class for the composite ID
	public static class HelloTableId implements MultiFieldId<Hello> {
		public String a;
		public Integer b;

        // ... constructors and 'values()' method ...
	}

	public static class Columns extends TableColumns<Hello> {
		public final TextColumn a = new TextColumn(this, "a");
		public final NumericColumn<Integer> b = new NumericColumn<>(this, "b");
        // ...
	}

    // ...

    public HelloTable() {
        super(Hello.class, "Hello");
        
        // 2. Automatically sets up the MultiFieldIDColumn
        setIdField(new MultiFieldIDColumn<Hello, HelloTableId>(this, a(), b())
            .withMainClassOf(HelloTableId.class));
    }
    
    // ... accessors for a() and b() ...
}`,
    crud: `// Get the generated table instance
EmployeeTable employeeTable = new EmployeeTable();

// Get an EntityManager bound to your ConnectionManager
// (Assuming 'connectionManager' is your configured bean)
EntityManager<Employee, Long> employeeManager = employeeTable.manager(connectionManager);

// --- CRUD Operations ---

// CREATE
Employee newEmployee = new Employee();
newEmployee.setFirstName("Jane");
newEmployee.setLastName("Doe");
employeeManager.save(newEmployee);

// READ (By Id)
Employee foundEmployee = employeeManager.findById(1L);

// READ (All)
List<Employee> allEmployees = employeeManager.getAll();

// UPDATE
foundEmployee.setTitle("Senior Developer");
employeeManager.update(foundEmployee);

// DELETE (By Id)
employeeManager.deleteById(1L);

// DELETE (By Condition)
employeeManager.delete(employeeTable.firstName().equal(ColumnInfo.valueOf("Jane")));`,
    whereClause: `// SQL: SELECT * FROM employee WHERE concat(firstname, ' ', lastname) = 'Sven Buck'
EmployeeTable table = new EmployeeTable();
String fullName = "Sven Buck";

Employee employee = entityManager
    .query() // Returns a SelectQuery
    .where(
        Concat.of(
            table.firstName(),
            ColumnInfo.valueOf(" "),
            table.lastName()
        ).equal(ColumnInfo.valueOf(fullName))
    ).find();`,
    joins: `/*
    SQL:
    SELECT c.contactName as name, sum(od.unitPrice * od.quantity * (1 - od.discount)) as total
    FROM customer c
    JOIN salesorder so ON cast(so.custId as integer) = c.custId
    JOIN orderdetail od ON od.orderId = so.orderId
    GROUP BY c.custId
    ORDER BY total DESC;
*/

// 1. Alias tables for cleaner queries
CustomerTable c = new CustomerTable().aliased("c");
SalesOrderTable so = new SalesOrderTable().aliased("so");
OrderDetailTable od = new OrderDetailTable().aliased("od");

// 2. Define the 'total' aggregation column
var total = Sum.of(
    od.unitPrice().multiple(
        od.quantity().castTo(Double.class).multiple(
            ColumnInfo.valueOf(1).asNumber().subtract(od.discount())
        )
    )
).as("total");

// 3. Build the query
List<CustomerWithTotal> results = entityManager.query()
    .table(c) // FROM customer c
    .join(so, c.custId().equal(so.custId())) // JOIN salesorder so ...
    .join(od, od.orderId().equal(so.orderId())) // JOIN orderdetail od ...
    .select(
        c.contactName().as("name"), // SELECT c.contactName as name
        total                      // , sum(...) as total
    )
    .groupBy(c.custId()) // GROUP BY c.custId
    .orderBy(total.descendingOrder()) // ORDER BY total DESC
    .list(CustomerWithTotal.class); // Map results to a DTO`,
    subqueries: `/*
    SQL:
    SELECT a.* from (
        select so.*, sum(od.unitPrice * od.quantity * (1 - od.discount)) total
        FROM salesorder so
        join orderdetail od on od.orderId = so.orderId
        GROUP by so.orderId
        ORDER by total desc
    ) a where a.total BETWEEN 5000 and 12000
*/

// Aliases
SalesOrderTable so = new SalesOrderTable().aliased("so");
OrderDetailTable od = new OrderDetailTable().aliased("od");

// Total calculation
Sum<Double> total = Sum.of(/* ... */).as("total");

// 1. Define the subquery
var subQuery =
    new SubQuery<SalesOrder>()
        .table(so)
        .select(
            so.allColumns(), // Selects all columns from SalesOrder
            total
        )
        .join(od, od.orderId().equal(so.orderId()))
        .groupBy(so.orderId())
        .orderBy(total.descendingOrder())
        .aliased("a"); // This subquery becomes "a"

// 2. Select FROM the subquery
List<SalesOrder> orders = entityManager
    .query()
    .table(subQuery) // FROM (subquery) a
    .select(subQuery.allColumns()) // SELECT a.*
    .where(total.between(ColumnInfo.valueOf(5000.0), ColumnInfo.valueOf(12000.0))) // WHERE a.total BETWEEN ...
    .list();`,
    transactions: `// App.java
manager.transaction((con, tr) -> {
    System.out.println("Deleted " +
        modelManager
            .withConnection(con) // Use the special transactional connection
            .delete(ip.equal(ColumnInfo.valueOf(ipToDelete)))
        + " rows"
    );

    // Rollback the changes
    return TransactionResult.ROLLBACK;
    
    // Or commit them:
    // return TransactionResult.COMMIT;
});`
};