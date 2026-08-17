package ch.celestin.gyoza.pack;

import ch.celestin.gyoza.pack.dto.CreatePackRequest;
import ch.celestin.gyoza.pack.dto.PackResponse;
import ch.celestin.gyoza.pack.dto.UpdatePackRequest;

public interface PackOptionService {

    PackResponse addPack(Long productId, CreatePackRequest request);

    PackResponse updatePack(Long packId, UpdatePackRequest request);

    void deletePack(Long packId);
}
