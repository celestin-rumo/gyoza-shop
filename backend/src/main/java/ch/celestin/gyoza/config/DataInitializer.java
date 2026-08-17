package ch.celestin.gyoza.config;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

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
}