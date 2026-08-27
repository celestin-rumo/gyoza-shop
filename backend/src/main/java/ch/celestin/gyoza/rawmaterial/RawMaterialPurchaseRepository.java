package ch.celestin.gyoza.rawmaterial;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RawMaterialPurchaseRepository
        extends JpaRepository<RawMaterialPurchase, Long> {

    List<RawMaterialPurchase> findByRawMaterialIdOrderByDateDescIdDesc(Long rawMaterialId);

    List<RawMaterialPurchase> findAllByOrderByDateDescIdDesc();

    Optional<RawMaterialPurchase> findFirstByRawMaterialIdOrderByDateDescIdDesc(Long rawMaterialId);

    boolean existsByRawMaterialId(Long rawMaterialId);
}
