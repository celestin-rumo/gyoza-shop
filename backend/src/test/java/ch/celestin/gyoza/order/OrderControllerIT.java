package ch.celestin.gyoza.order;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrderControllerIT extends AbstractIntegrationTest {

    @Autowired
    private PackOptionRepository packOptionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void createOrder_persistsIt_andDecrementsTheProductStock() throws Exception {
        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Product chicken = sixPackOfChicken.getProduct();
        int stockBefore = chicken.getStockQuantity();

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": "1 rue du Test, Lausanne"
                                  },
                                  "lines": [{"packId": %d, "quantity": 2}]
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("RESERVED")))
                .andExpect(jsonPath("$.items", hasSize(1)));

        Product reloaded = productRepository.findById(chicken.getId()).orElseThrow();
        assertThat(reloaded.getStockQuantity()).isEqualTo(stockBefore - 2 * sixPackOfChicken.getSize());
    }

    @Test
    void createOrder_withAnUnknownPack_isRejected() throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": "1 rue du Test, Lausanne"
                                  },
                                  "lines": [{"packId": 999999, "quantity": 1}]
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("PACK_NOT_FOUND")));
    }
}
