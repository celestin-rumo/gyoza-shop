package ch.celestin.gyoza.rawmaterial;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RawMaterialRepository
        extends JpaRepository<RawMaterial, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
