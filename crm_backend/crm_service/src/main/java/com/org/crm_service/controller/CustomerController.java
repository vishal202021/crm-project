package com.org.crm_service.controller;

import com.org.crm_service.dto.CustomerDTO;
import com.org.crm_service.dto.CustomerSummaryDTO;
import com.org.crm_service.entity.Customer;
import com.org.crm_service.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerService service;

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Customer> add( @Valid @RequestBody CustomerDTO dto){
        return ResponseEntity.ok().body(service.save(dto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Page<Customer>> all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ){
        return ResponseEntity.ok(
                service.all(page, size, sortBy, direction)
        );
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<List<Customer>> allCustomers(){
        return ResponseEntity.ok(service.findAll());
    }



    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PutMapping("/{id}")
    public ResponseEntity<Customer> update(@PathVariable Long id,@Valid @RequestBody CustomerDTO customer){
        return ResponseEntity.ok().body(service.update(id,customer));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Page<CustomerSummaryDTO>> summary(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="10") int size,
            @RequestParam(defaultValue="createdDate") String sortBy,
            @RequestParam(defaultValue="desc") String direction
    ){
        return ResponseEntity.ok(
                service.getSummaryPage(page,size,sortBy,direction)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Customer> getById(@PathVariable Long id){
        return ResponseEntity.ok().body(service.findById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<String> delete(@PathVariable Long id){
        service.deleteCustomer(id);
        return ResponseEntity.ok().body("Customer deleted");
    }



}
