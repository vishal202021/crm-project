package com.org.crm_service.repo;

import com.org.crm_service.entity.AppUser;
import com.org.crm_service.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<AppUser,Long> {

    Optional<AppUser> findByEmail(String email);
    List<AppUser> findByStatus(UserStatus status);
    List<AppUser> findByStatusNot(UserStatus status);



}
