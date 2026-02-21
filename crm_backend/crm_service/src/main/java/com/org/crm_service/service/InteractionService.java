package com.org.crm_service.service;

import com.org.crm_service.dto.InteractionDTO;
import com.org.crm_service.dto.TodayFollowupDTO;
import com.org.crm_service.entity.Customer;
import com.org.crm_service.entity.Interaction;
import com.org.crm_service.exception.ResourceNotFoundException;
import com.org.crm_service.repo.CustomerRepository;
import com.org.crm_service.repo.InteractionRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final InteractionRepository repo;
    private final CustomerRepository customerRepo;


    public Interaction save(InteractionDTO dto){

        Customer c=customerRepo
                .findByIdAndDeletedFalse(dto.getCustomerId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Customer not found"));

        Interaction i=new Interaction();
        BeanUtils.copyProperties(dto,i);
        i.setCustomer(c);

        return repo.save(i);
    }


    public List<Interaction> timeline(Long id){
        return repo
                .findByCustomerIdAndDeletedFalseOrderByInteractionDateDesc(id);
    }




    public List<TodayFollowupDTO> today(){
        return repo
                .findTodayFollowups();
    }

    public List<Interaction> findAll(){
        return repo.findByDeletedFalse();
    }



    public Interaction update(Long id,
                              InteractionDTO dto){

        Interaction i=repo
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Interaction not found"));

        if(dto.getStatus()!=null)
            i.setStatus(dto.getStatus());

        if(dto.getNextFollowupDate()!=null)
            i.setNextFollowupDate(dto.getNextFollowupDate());

        if(dto.getFollowupDetails()!=null)
            i.setFollowupDetails(dto.getFollowupDetails());

        if(dto.getCallBy()!=null)
            i.setCallBy(dto.getCallBy());

        if(dto.getCallingType()!=null)
            i.setCallingType(dto.getCallingType());

        return repo.save(i);
    }



    public void deleteInteraction(Long id){

        Interaction i=repo
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Interaction not found"));

        i.setDeleted(true);

        repo.save(i);
    }

}
