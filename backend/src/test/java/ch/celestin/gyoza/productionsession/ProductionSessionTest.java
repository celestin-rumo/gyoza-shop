package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class ProductionSessionTest {

    private final LocalDate date = LocalDate.of(2026, 8, 24);

    @Test
    void addRawMaterialUsage_appendsItAndLinksItBack() {
        ProductionSession session = new ProductionSession(date, "L20260824-01", new BigDecimal("3"), null);
        RawMaterialUsage usage = new RawMaterialUsage(new RawMaterial("Farine", "kg"), BigDecimal.TEN);

        session.addRawMaterialUsage(usage);

        assertThat(session.getRawMaterialUsages()).containsExactly(usage);
    }

    @Test
    void addParticipant_appendsItAndLinksItBack() {
        ProductionSession session = new ProductionSession(date, "L20260824-01", new BigDecimal("3"), null);
        User user = new User(
                "cook@example.com", "hash", "Cel", "Nino",
                "Rue 1", "1000", "Lausanne", Role.ADMIN, true
        );
        SessionParticipant participant = new SessionParticipant(user);

        session.addParticipant(participant);

        assertThat(session.getParticipants()).containsExactly(participant);
    }

    @Test
    void addOutput_appendsItAndLinksItBack() {
        ProductionSession session = new ProductionSession(date, "L20260824-01", new BigDecimal("3"), null);
        ProductOutput output = new ProductOutput(new Product("Chicken", 100), 50);

        session.addOutput(output);

        assertThat(session.getOutputs()).containsExactly(output);
    }

    @Test
    void getters_exposeDateBatchNumberDurationAndNotes() {
        ProductionSession session = new ProductionSession(
                date, "L20260824-01", new BigDecimal("3.5"), "Session du samedi"
        );

        assertThat(session.getDate()).isEqualTo(date);
        assertThat(session.getBatchNumber()).isEqualTo("L20260824-01");
        assertThat(session.getDurationHours()).isEqualByComparingTo("3.5");
        assertThat(session.getNotes()).isEqualTo("Session du samedi");
    }

    @Test
    void constructor_rejectsNonPositiveDuration() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ProductionSession(date, "L20260824-01", BigDecimal.ZERO, null));
    }

    @Test
    void constructor_rejectsNullDuration() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ProductionSession(date, "L20260824-01", null, null));
    }
}
