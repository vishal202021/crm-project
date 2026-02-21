package com.org.crm_service.service;

import com.org.crm_service.dto.LoginDto;
import com.org.crm_service.dto.RegisterDto;
import com.org.crm_service.entity.AppUser;
import com.org.crm_service.entity.Role;
import com.org.crm_service.entity.UserStatus;
import com.org.crm_service.exception.BadRequestException;
import com.org.crm_service.exception.ForbiddenException;
import com.org.crm_service.exception.UnauthorizedException;
import com.org.crm_service.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public void register(RegisterDto dto){

        if(userRepo.findByEmail(dto.getEmail()).isPresent())
            throw new BadRequestException("Email already exists");

        AppUser u = new AppUser();
        u.setEmail(dto.getEmail());
        u.setPassword(encoder.encode(dto.getPassword()));
        u.setRole(Role.USER);
        u.setStatus(UserStatus.PENDING);

        userRepo.save(u);
    }

    public String login(LoginDto dto){

        AppUser user = userRepo.findByEmail(dto.getEmail())
                .orElseThrow(() ->
                        new UnauthorizedException("Invalid credentials"));

        if(!encoder.matches(dto.getPassword(), user.getPassword()))
            throw new UnauthorizedException("Invalid credentials");

        if (user.getRole() == Role.USER &&
                user.getStatus() != UserStatus.ACTIVE)
            throw new ForbiddenException("Account not active");

        return jwt.generateToken(user);
    }
}

