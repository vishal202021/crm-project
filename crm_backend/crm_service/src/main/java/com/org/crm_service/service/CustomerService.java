package com.org.crm_service.service;

import com.org.crm_service.dto.ContactDTO;
import com.org.crm_service.dto.CustomerDTO;
import com.org.crm_service.dto.CustomerSummaryDTO;
import com.org.crm_service.entity.Contact;
import com.org.crm_service.entity.Customer;
import com.org.crm_service.entity.Interaction;
import com.org.crm_service.exception.BadRequestException;
import com.org.crm_service.exception.ResourceNotFoundException;
import com.org.crm_service.repo.CustomerRepository;
import com.org.crm_service.repo.InteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repo;
    private final InteractionRepository interactionRepository;


    public Customer save(CustomerDTO dto){

        if(dto.getContacts()
                .stream()
                .noneMatch(ContactDTO::isPrimaryContact)){
            throw new BadRequestException(
                    "One contact must be primary");
        }

        Customer c = new Customer();
        BeanUtils.copyProperties(dto,c);

        applyContacts(dto,c);

        return repo.save(c);
    }



    public Customer update(Long id, CustomerDTO dto){

        Customer existing = repo.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer not found"));

        BeanUtils.copyProperties(dto,existing,
                "id","contacts","interactions","createdDate");

        existing.getContacts().clear();

        applyContacts(dto,existing);

        return repo.save(existing);
    }



    private void applyContacts(CustomerDTO dto, Customer customer){

        if(dto.getContacts()==null || dto.getContacts().isEmpty())
            return;

        List<Contact> list = dto.getContacts().stream().map(cd -> {
            Contact ct = new Contact();
            BeanUtils.copyProperties(cd,ct);
            ct.setCustomer(customer);
            return ct;
        }).toList();

        customer.getContacts().addAll(list);


        Contact primary = list.stream()
                .filter(Contact::isPrimaryContact)
                .findFirst()
                .orElse(list.get(0));


        customer.setContactName(primary.getName());
        customer.setContactNo(primary.getPhone());
        customer.setPosition(primary.getPosition());
    }


    public Page<Customer> all(
            int page,
            int size,
            String sortBy,
            String direction){

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page,size,sort);

        return repo.findByDeletedFalse(pageable);
    }

    public Page<CustomerSummaryDTO> getSummaryPage(
            int page,int size,String sortBy,String direction){

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page,size,sort);

        Page<Customer> customerPage =repo.findByDeletedFalse(pageable);

        return customerPage.map(c -> {

            Interaction latest =
                    interactionRepository
                            .findTopByCustomerOrderByIdDesc(c);

            return new CustomerSummaryDTO(
                    c.getId(),
                    c.getCustomerName(),
                    c.getContactName(),
                    c.getContactNo(),
                    c.getPriority(),
                    latest != null ? latest.getStatus() : null,
                    latest != null ? latest.getNextFollowupDate() : null,
                    c.getTaluka(),
                    c.getCreatedDate(),
                    latest != null ? latest.getId() : null
            );
        });
    }


    public Customer findById(Long id){
        return repo.findByIdAndDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer not found"));
    }



    public void deleteCustomer(Long id){

        Customer c = repo.findByIdAndDeletedFalse(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer not found"));

        c.setDeleted(true);

        repo.save(c);
    }


    public List<Customer> findAll(){
        return repo.findByDeletedFalse();
    }

}
