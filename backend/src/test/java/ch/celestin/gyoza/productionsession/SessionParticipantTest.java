package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class SessionParticipantTest {

    private final User user = new User(
            "cook@example.com", "hash", "Cel", "Nino",
            "Rue 1", "1000", "Lausanne", Role.ADMIN, true
    );

    @Test
    void constructor_setsUserAndHours() {
        SessionParticipant participant = new SessionParticipant(user, new BigDecimal("3.5"));

        assertThat(participant.getUser()).isEqualTo(user);
        assertThat(participant.getHoursSpent()).isEqualByComparingTo("3.5");
    }

    @Test
    void constructor_rejectsNonPositiveHours() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new SessionParticipant(user, BigDecimal.ZERO));
    }

    @Test
    void constructor_rejectsNullHours() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new SessionParticipant(user, null));
    }
}
