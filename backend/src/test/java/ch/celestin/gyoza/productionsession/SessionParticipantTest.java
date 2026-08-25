package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SessionParticipantTest {

    private final User user = new User(
            "cook@example.com", "hash", "Cel", "Nino",
            "Rue 1", "1000", "Lausanne", Role.ADMIN, true
    );

    @Test
    void constructor_setsUser() {
        SessionParticipant participant = new SessionParticipant(user);

        assertThat(participant.getUser()).isEqualTo(user);
    }
}
