package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.productionsession.dto.CreateProductionSessionRequest;
import ch.celestin.gyoza.productionsession.dto.ProductionSessionResponse;

import java.util.List;

public interface ProductionSessionService {

    ProductionSessionResponse createSession(CreateProductionSessionRequest request);

    List<ProductionSessionResponse> getAllSessions();

    ProductionSessionResponse getSession(Long sessionId);
}
