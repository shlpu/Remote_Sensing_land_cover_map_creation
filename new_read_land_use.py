"""
Added by Saaransh 27th March 2018
Modified by Saaransh 27th March 2018
Des: This code is used to pre-process the lower resolution reference data. 
Filter only the required region of interest and give it a fixed dimention.

Comment by original author: Use read_land_use() to generate a label map and a dict of classes.
 We will have to fill in the resolution of downloaded images (they should have the same resolution).
 The x and y here are inverted compared to the matrix representation.
"""
# Loading libraries 
import numpy as np
import fiona # used to read shape files
from shapely.geometry import Polygon
from shapely.wkt import dumps, loads
from shapely.geometry import asShape, mapping
from rasterio import features, transform
from multiprocessing import Pool


class Shrinker(object):
    def __init__(self, buffer):
        self.buffer = buffer

    def __call__(self, feature):
        geom = asShape(feature['geometry'])
        buffered = geom.buffer(self.buffer)
        return feature, buffered


def read_land_use(da_shapefile="./fwdrevluisanddecrasecunclassified/VLUIS_Field_2016_EPSG3857_MercatorWorld.shp", # This is mordified to the location of the new shape file
                  resolution=(513, 312), # This is the size of the raster image we pulled
                  area_filter= "POLYGON ((16181130 -4533570, 16181130 -4542930, 16196520 -4542930, 16196520 -4533570, 16181130 -4533570))", # These are the cordinates of the new area
                  buffer=-0.0005,
                  processes=8):
    file = fiona.open(da_shapefile)
    filter_poly = loads(area_filter)
    filtered = list(file.values(bbox=filter_poly.bounds))
    print("test point 1")
    print(filtered)
    # return file
    shrunk = []

    p = Pool(processes)
    for feature, buffered in p.imap(Shrinker(buffer), filtered):
        if buffered.is_empty:
            pass
            # filtered.remove(feature)
        else:
            # filtered.remove(feature)
            feature['geometry'] = mapping(buffered)
            shrunk.append(feature)
    p.close()
    del filtered

    unique_classes = np.unique([feature['properties']['LC_PRIM_CL'] for feature in shrunk])
    unique_classes_dict = {i + 1: unique_classes[i] for i in range(len(unique_classes))}
    unique_classes_dict[0] = 'No data'
    unique_classes_inv = {v: k for k, v in unique_classes_dict.items()}
    shapes = ((feature['geometry'], unique_classes_inv[feature['properties']['LC_PRIM_CL']]) for feature in shrunk)
    x_min, y_min, x_max, y_max = filter_poly.bounds
    x_res, y_res = resolution
    # pixel_size = (x_max - x_min) / x_res
    image = features.rasterize(
        ((g, v) for g, v in shapes),
        out_shape=(y_res, x_res),
        transform=transform.from_bounds(x_min, y_min, x_max, y_max, x_res, y_res))
    return image, unique_classes_dict
