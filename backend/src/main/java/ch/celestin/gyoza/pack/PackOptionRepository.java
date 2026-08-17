package ch.celestin.gyoza.pack;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackOptionRepository
        extends JpaRepository<PackOption, Long> {

    List<PackOption> findByProductId(Long productId);
}