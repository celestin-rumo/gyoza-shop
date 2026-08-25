package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "session_participants")
public class SessionParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "production_session_id", nullable = false)
    private ProductionSession productionSession;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    protected SessionParticipant() {
    }

    public SessionParticipant(User user) {
        this.user = user;
    }

    public void setProductionSession(ProductionSession productionSession) {
        this.productionSession = productionSession;
    }

    public User getUser() {
        return user;
    }
}
