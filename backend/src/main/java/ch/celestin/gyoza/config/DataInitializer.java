package ch.celestin.gyoza.config;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.slot.SlotAvailability;
import ch.celestin.gyoza.slot.SlotAvailabilityRepository;
import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;

@Configuration
@EnableConfigurationProperties(AdminProperties.class)
public class DataInitializer {

    @Bean
    CommandLineRunner initAdminUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AdminProperties adminProperties
    ) {
        return args -> {

            String email = adminProperties.email().toLowerCase();

            if (userRepository.existsByEmail(email)) {
                return;
            }

            userRepository.save(new User(
                    email,
                    passwordEncoder.encode(adminProperties.password()),
                    "Admin",
                    "Gyoza",
                    "Chemin de la Pudressa 35",
                    "1731",
                    "Ependes",
                    Role.ADMIN,
                    true
            ));
        };
    }

    @Bean
    CommandLineRunner initData(
            ProductRepository productRepository,
            PackOptionRepository packOptionRepository
    ) {
        return args -> {

            if (productRepository.count() > 0) {
                return;
            }

            Product chicken =
                    productRepository.save(
                            new Product("Chicken", 200)
                    );

            Product vegetable =
                    productRepository.save(
                            new Product("Vegetable", 150)
                    );

            packOptionRepository.save(
                    new PackOption(
                            chicken,
                            6,
                            new BigDecimal("12.00")
                    )
            );

            packOptionRepository.save(
                    new PackOption(
                            chicken,
                            10,
                            new BigDecimal("19.00")
                    )
            );

            packOptionRepository.save(
                    new PackOption(
                            chicken,
                            20,
                            new BigDecimal("36.00")
                    )
            );

            packOptionRepository.save(
                    new PackOption(
                            vegetable,
                            6,
                            new BigDecimal("11.00")
                    )
            );

            packOptionRepository.save(
                    new PackOption(
                            vegetable,
                            10,
                            new BigDecimal("17.00")
                    )
            );

            packOptionRepository.save(
                    new PackOption(
                            vegetable,
                            20,
                            new BigDecimal("32.00")
                    )
            );
        };
    }

    @Bean
    CommandLineRunner initSlotAvailability(
            SlotAvailabilityRepository slotAvailabilityRepository
    ) {
        return args -> {

            if (slotAvailabilityRepository.count() > 0) {
                return;
            }

            LocalDate deliveryDate = nextDateOnOrAfter(DayOfWeek.TUESDAY);
            LocalDate pickupDate = nextDateOnOrAfter(DayOfWeek.SATURDAY);

            // Both content types are seeded on both dates/methods, so a fresh
            // dev/e2e environment can place either kind of order without an
            // extra manual admin step.
            for (ContentType contentType : ContentType.values()) {
                slotAvailabilityRepository.save(new SlotAvailability(
                        deliveryDate,
                        FulfillmentMethod.DELIVERY,
                        LocalTime.of(18, 0),
                        LocalTime.of(20, 0),
                        contentType
                ));

                slotAvailabilityRepository.save(new SlotAvailability(
                        pickupDate,
                        FulfillmentMethod.PICKUP,
                        LocalTime.of(10, 0),
                        LocalTime.of(12, 0),
                        contentType
                ));
            }
        };
    }

    private LocalDate nextDateOnOrAfter(DayOfWeek dayOfWeek) {
        return LocalDate.now().with(TemporalAdjusters.nextOrSame(dayOfWeek));
    }
}
