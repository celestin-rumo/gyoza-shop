package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

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

    @Column(nullable = false)
    private BigDecimal hoursSpent;

    protected SessionParticipant() {
    }

    public SessionParticipant(User user, BigDecimal hoursSpent) {
        if (hoursSpent == null || hoursSpent.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Le temps passé doit être supérieur à 0"
            );
        }

        this.user = user;
        this.hoursSpent = hoursSpent;
    }

    public void setProductionSession(ProductionSession productionSession) {
        this.productionSession = productionSession;
    }

    public User getUser() {
        return user;
    }

    public BigDecimal getHoursSpent() {
        return hoursSpent;
    }
}
