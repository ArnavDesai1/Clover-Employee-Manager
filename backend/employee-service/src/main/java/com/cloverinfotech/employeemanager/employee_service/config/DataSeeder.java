package com.cloverinfotech.employeemanager.employee_service.config;

import com.cloverinfotech.employeemanager.employee_service.entity.Employee;
import com.cloverinfotech.employeemanager.employee_service.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Disabled by default. Enable explicitly if you want demo data seeded:
     * - application.properties: app.seed.enabled=true
     * - or env var: APP_SEED_ENABLED=true (Spring maps APP_SEED_ENABLED -> app.seed.enabled)
     */
    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            System.out.println("🌱 Demo seeding disabled (app.seed.enabled=false). Skipping seed.");
            return;
        }

        final int targetEmployees = 20;
        long current = employeeRepository.count();

        // Seed if below target
        if (current < targetEmployees) {
            System.out.println("🌱 Seeding database with dummy employees (target: " + targetEmployees + ")...");

            // Avoid duplicates (pan is unique)
            Set<String> existingPans = employeeRepository.findAll().stream()
                    .map(Employee::getPan)
                    .filter(p -> p != null && !p.isBlank())
                    .collect(Collectors.toSet());

            List<Employee> seedEmployees = Arrays.asList(
                createEmployee("Priya Sharma", "Senior Software Engineer", LocalDate.of(1992, 5, 15), "Female", 
                    "Reading,Coding,Traveling,Photography", "123 MG Road", "Near Metro Station", "Bangalore", 
                    "Karnataka", "560001", "ABCDE1234F"),
                
                createEmployee("Rajesh Kumar", "Project Manager", LocalDate.of(1988, 8, 22), "Male",
                    "Sports,Gaming,Music", "456 Park Street", "Kolkata", "Kolkata", "West Bengal", 
                    "700016", "FGHIJ5678K"),
                
                createEmployee("Anita Desai", "HR Manager", LocalDate.of(1990, 3, 10), "Female",
                    "Reading,Writing,Traveling,Cooking", "789 Sector 18", "Noida", "Noida", "Uttar Pradesh",
                    "201301", "KLMNO9012P"),
                
                createEmployee("Vikram Singh", "DevOps Engineer", LocalDate.of(1993, 11, 5), "Male",
                    "Coding,Gaming,Sports", "321 IT Park", "Pune", "Pune", "Maharashtra", "411057", 
                    "PQRST3456U"),
                
                createEmployee("Meera Patel", "UI/UX Designer", LocalDate.of(1994, 7, 18), "Female",
                    "Art,Photography,Traveling,Music", "654 Design Hub", "Ahmedabad", "Ahmedabad", "Gujarat",
                    "380009", "VWXYZ7890A"),
                
                createEmployee("Arjun Reddy", "Full-stack Developer", LocalDate.of(1995, 2, 28), "Male",
                    "Coding,Gaming,Music,Sports", "987 Tech Valley", "Hyderabad", "Hyderabad", "Telangana",
                    "500032", "BCDEF1234G"),
                
                createEmployee("Sneha Nair", "QA Engineer", LocalDate.of(1991, 9, 12), "Female",
                    "Reading,Writing,Cooking", "147 Test Street", "Chennai", "Chennai", "Tamil Nadu",
                    "600028", "HIJKL5678M"),
                
                createEmployee("Amit Verma", "Backend Developer", LocalDate.of(1992, 12, 25), "Male",
                    "Coding,Reading,Gaming", "258 Server Lane", "Gurgaon", "Gurgaon", "Haryana",
                    "122001", "NOPQR9012S"),
                
                createEmployee("Kavita Joshi", "Business Analyst", LocalDate.of(1989, 4, 7), "Female",
                    "Reading,Traveling,Writing", "369 Business Park", "Mumbai", "Mumbai", "Maharashtra",
                    "400053", "TUVWX3456Y"),
                
                createEmployee("Rohit Malhotra", "Data Scientist", LocalDate.of(1993, 6, 30), "Male",
                    "Coding,Reading,Photography", "741 Data Center", "Bangalore", "Bangalore", "Karnataka",
                    "560066", "ZABCD7890E"),
                
                createEmployee("Divya Iyer", "Frontend Developer", LocalDate.of(1994, 1, 14), "Female",
                    "Art,Coding,Music,Traveling", "852 UI Avenue", "Pune", "Pune", "Maharashtra",
                    "411020", "FGHIJ1234K"),
                
                createEmployee("Suresh Menon", "System Administrator", LocalDate.of(1990, 10, 8), "Male",
                    "Gaming,Sports,Music", "963 Admin Block", "Kochi", "Kochi", "Kerala",
                    "682030", "LMNOP5678Q"),
                
                createEmployee("Pooja Agarwal", "Marketing Manager", LocalDate.of(1987, 5, 20), "Female",
                    "Traveling,Photography,Writing,Cooking", "159 Marketing Square", "Delhi", "Delhi", "Delhi",
                    "110001", "QRSTU9012V"),
                
                createEmployee("Nikhil Shah", "Mobile App Developer", LocalDate.of(1995, 8, 3), "Male",
                    "Coding,Gaming,Sports", "357 App Street", "Ahmedabad", "Ahmedabad", "Gujarat",
                    "380015", "WXYZA3456B"),
                
                createEmployee("Shruti Rao", "Content Writer", LocalDate.of(1992, 11, 17), "Female",
                    "Writing,Reading,Traveling,Music", "468 Content Hub", "Bangalore", "Bangalore", "Karnataka",
                    "560095", "CDEFG7890H"),
                
                createEmployee("Manish Tiwari", "Network Engineer", LocalDate.of(1991, 3, 25), "Male",
                    "Gaming,Sports,Coding", "579 Network Road", "Noida", "Noida", "Uttar Pradesh",
                    "201301", "HIJKL1234M"),
                
                createEmployee("Aishwarya Nair", "Product Manager", LocalDate.of(1989, 7, 9), "Female",
                    "Reading,Traveling,Photography,Writing", "680 Product Plaza", "Mumbai", "Mumbai", "Maharashtra",
                    "400070", "NOPQR5678S"),
                
                createEmployee("Karan Mehta", "Security Analyst", LocalDate.of(1993, 2, 14), "Male",
                    "Coding,Reading,Gaming", "791 Security Tower", "Gurgaon", "Gurgaon", "Haryana",
                    "122002", "TUVWX9012Y"),
                
                createEmployee("Neha Kapoor", "Sales Executive", LocalDate.of(1994, 9, 21), "Female",
                    "Traveling,Music,Photography,Cooking", "802 Sales Center", "Delhi", "Delhi", "Delhi",
                    "110092", "ZABCD3456E"),
                
                createEmployee("Aditya Joshi", "Cloud Architect", LocalDate.of(1988, 12, 6), "Male",
                    "Coding,Reading,Sports", "913 Cloud Complex", "Pune", "Pune", "Maharashtra",
                    "411045", "FGHIJ7890K")
            );

            List<Employee> toInsert = seedEmployees.stream()
                    .filter(e -> e.getPan() == null || e.getPan().isBlank() || !existingPans.contains(e.getPan()))
                    .limit(Math.max(0, targetEmployees - current))
                    .toList();

            if (toInsert.isEmpty()) {
                System.out.println("📊 Database already has " + current + " employees and matching seed PANs. Skipping seed.");
                return;
            }

            employeeRepository.saveAll(toInsert);
            long after = employeeRepository.count();
            System.out.println("✅ Seeded " + toInsert.size() + " employees. Total now: " + after);
        } else {
            System.out.println("📊 Database already has " + current + " employees. Skipping seed.");
        }
    }

    private Employee createEmployee(String name, String role, LocalDate birthdate, String gender,
                                   String hobbies, String address1, String address2, String city,
                                   String state, String pin, String pan) {
        Employee emp = new Employee();
        emp.setName(name);
        emp.setRole(role);
        emp.setBirthdate(birthdate);
        emp.setGender(gender);
        emp.setHobbies(hobbies);
        emp.setAddress1(address1);
        emp.setAddress2(address2);
        emp.setCity(city);
        emp.setState(state);
        emp.setPin(pin);
        emp.setPan(pan);
        return emp;
    }
}
