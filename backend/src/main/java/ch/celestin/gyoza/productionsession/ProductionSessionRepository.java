package ch.celestin.gyoza.productionsession;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ProductionSessionRepository
        extends JpaRepository<ProductionSession, Long> {

    List<ProductionSession> findAllByOrderByDateDesc();

    List<ProductionSession> findAllByDateBetweenOrderByDateAsc(LocalDate start, LocalDate end);

    long countByDate(LocalDate date);
}
