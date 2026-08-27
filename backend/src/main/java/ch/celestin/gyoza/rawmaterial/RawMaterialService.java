package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.rawmaterial.dto.CreateRawMaterialRequest;
import ch.celestin.gyoza.rawmaterial.dto.RawMaterialResponse;
import ch.celestin.gyoza.rawmaterial.dto.UpdateRawMaterialRequest;

import java.util.List;

public interface RawMaterialService {

    List<RawMaterialResponse> getAllRawMaterials();

    RawMaterialResponse createRawMaterial(CreateRawMaterialRequest request);

    RawMaterialResponse updateRawMaterial(Long rawMaterialId, UpdateRawMaterialRequest request);

    void deleteRawMaterial(Long rawMaterialId);
}
