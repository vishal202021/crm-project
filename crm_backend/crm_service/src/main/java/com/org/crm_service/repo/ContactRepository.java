package com.org.crm_service.repo;

import com.org.crm_service.entity.Contact;

import org.springframework.data.jpa.repository.JpaRepository;


public interface ContactRepository extends JpaRepository<Contact,Long> {

}
