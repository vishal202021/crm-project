package com.org.crm_service.controller;

import com.org.crm_service.dto.InteractionDTO;
import com.org.crm_service.dto.TodayFollowupDTO;
import com.org.crm_service.entity.Interaction;
import com.org.crm_service.service.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/interactions")
public class InteractionController {

     private final InteractionService service;

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping
    public ResponseEntity<List<Interaction>> all(){
        return ResponseEntity.ok(service.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PostMapping
    public ResponseEntity<Interaction> add(  @Valid @RequestBody InteractionDTO dto){
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/timeline/{id}")
    public ResponseEntity<List<Interaction>> timeline(@PathVariable Long id){
        return ResponseEntity.ok().body(service.timeline(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/today")
    public ResponseEntity<List<TodayFollowupDTO>> today(){
        return ResponseEntity.ok().body(service.today());
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PutMapping("/{id}")
    public ResponseEntity<Interaction> update(@PathVariable Long id, @Valid @RequestBody InteractionDTO interactionDTO){
        return ResponseEntity.ok().body(service.update(id,interactionDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        service.deleteInteraction(id);
        return ResponseEntity.noContent().build();
    }
}
