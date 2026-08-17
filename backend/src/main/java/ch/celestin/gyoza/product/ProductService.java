package ch.celestin.gyoza.product;

import ch.celestin.gyoza.product.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    List<ProductResponse> getAllProducts();
}