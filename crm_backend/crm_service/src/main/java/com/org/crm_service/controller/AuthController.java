package com.org.crm_service.controller;

import com.org.crm_service.dto.LoginDto;
import com.org.crm_service.dto.RegisterDto;
import com.org.crm_service.entity.AppUser;
import com.org.crm_service.entity.Role;
import com.org.crm_service.entity.UserStatus;
import com.org.crm_service.repo.UserRepo;
import com.org.crm_service.service.AuthService;
import com.org.crm_service.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String,String>> register(@Valid @RequestBody RegisterDto dto){

        authService.register(dto);
        return ResponseEntity.ok(Map.of("message","Registered"));
    }


    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> registerAdmin(@RequestBody RegisterDto registerDto){
        AppUser admin=new AppUser();
        admin.setEmail(registerDto.getEmail());
        admin.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        userRepo.save(admin);
        return ResponseEntity.ok().body("Admin Registered");
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String,String>> login(
            @Valid @RequestBody LoginDto req) {
        String token = authService.login(req);
        return ResponseEntity.ok(Map.of("token",token));
    }



    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approve(
            @PathVariable Long id,
            Authentication auth){

        AppUser admin =
                userRepo.findByEmail(auth.getName())
                        .orElseThrow();

        if(admin.getRole() != Role.ADMIN){
            throw new RuntimeException("Only admin allowed");
        }

        AppUser user = userRepo.findById(id)
                .orElseThrow();

        if(user.getEmail().equals(admin.getEmail())){
            throw new RuntimeException(
                    "Admin cannot approve themselves");
        }

        user.setStatus(UserStatus.ACTIVE);

        userRepo.save(user);

        return ResponseEntity.ok("User approved");
    }



    @PostMapping("/reject/{id}")
    public ResponseEntity<String> reject(@PathVariable Long id){

        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(UserStatus.REJECTED);
        userRepo.save(user);

        return ResponseEntity.ok("User rejected");
    }


    @GetMapping("/pending")
    public List<AppUser> pending(){
        return userRepo.findByStatus(UserStatus.PENDING);
    }

    @GetMapping("/users")
    public List<AppUser> allUsers(Authentication auth){

        AppUser admin = userRepo
                .findByEmail(auth.getName())
                .orElseThrow();

        if(admin.getRole()!=Role.ADMIN)
            throw new RuntimeException("Only admin allowed");

        return userRepo.findByStatusNot(UserStatus.PENDING);
    }


    @PostMapping("/toggle/{id}")
    public ResponseEntity<String> toggle(
            @PathVariable Long id,
            Authentication auth){

        AppUser admin = userRepo
                .findByEmail(auth.getName())
                .orElseThrow();

        if(admin.getRole()!=Role.ADMIN)
            throw new RuntimeException("Only admin allowed");

        AppUser user = userRepo.findById(id)
                .orElseThrow();

        if(user.getEmail().equals(admin.getEmail()))
            throw new RuntimeException("Cannot deactivate yourself");

        user.setStatus(
                user.getStatus()==UserStatus.ACTIVE
                        ? UserStatus.INACTIVE
                        : UserStatus.ACTIVE
        );

        userRepo.save(user);

        return ResponseEntity.ok("Status updated");
    }


    @PostMapping("/role/{id}")
    public ResponseEntity<String> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String,String> body,
            Authentication auth){

        AppUser admin = userRepo
                .findByEmail(auth.getName())
                .orElseThrow();

        if(admin.getRole()!=Role.ADMIN)
            throw new RuntimeException("Only admin allowed");

        AppUser user = userRepo.findById(id)
                .orElseThrow();

        user.setRole(Role.valueOf(body.get("role")));

        userRepo.save(user);

        return ResponseEntity.ok("Role updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id,
            Authentication auth){

        AppUser admin = userRepo
                .findByEmail(auth.getName())
                .orElseThrow();

        if(admin.getRole()!=Role.ADMIN)
            throw new RuntimeException("Only admin allowed");

        userRepo.deleteById(id);

        return ResponseEntity.ok("User deleted");
    }





}
