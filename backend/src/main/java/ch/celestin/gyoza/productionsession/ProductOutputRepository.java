package ch.celestin.gyoza.productionsession;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductOutputRepository
        extends JpaRepository<ProductOutput, Long> {

    /** Oldest session first — see ProductOutputAllocationService for the FIFO consumption. */
    List<ProductOutput> findByProduct_IdAndRemainingQuantityGreaterThanOrderByProductionSession_DateAscIdAsc(
            Long productId, int remainingQuantity
    );
}
