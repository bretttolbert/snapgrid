var Geometry = Geometry || {};

Geometry.isPointOnLineSegment = function (lineSeg, point, tolerance) {
    //calculate slope of the line, in case of vertical line divide by zero like a boss
    var m = (lineSeg.p2.y - lineSeg.p1.y)
          / (lineSeg.p2.x - lineSeg.p1.x);
    var x,y;
    if (Math.abs(m) == Infinity) {
        x = point.x;
        y = point.y;
    } else {
        //calculate what y of the line would be if x were exactly point.x
        y = m * (point.x - lineSeg.p1.x) + lineSeg.p1.y;
        //calculate what x of the line would be if y were exactly point.y
        x = (point.y - lineSeg.p1.y) / m + lineSeg.p1.x;
    }
    //are calculated values within tolerance?
    if (Math.abs(y - point.y) < tolerance && Math.abs(y - point.y) < tolerance) {
        //point is (approximately) on the line but is it within the line segment?
        //determine extrema of the line segment
        var minX = Math.min(lineSeg.p1.x, lineSeg.p2.x);
        var minY = Math.min(lineSeg.p1.y, lineSeg.p2.y);
        var maxX = Math.max(lineSeg.p1.x, lineSeg.p2.x);
        var maxY = Math.max(lineSeg.p1.y, lineSeg.p2.y);
        if (   (point.x >= minX || minX - point.x < tolerance)
            && (point.y >= minY || minY - point.y < tolerance)
            && (point.x <= maxX || point.x - maxX < tolerance)
            && (point.y <= maxY || point.y - maxY < tolerance)) {
            return true;
        }
    }
    return false;
}

Geometry.distance = function(p1x, p1y, p2x, p2y) {
    return Math.sqrt(Math.pow(p2x - p1x,2) + Math.pow(p2y - p1y,2));
}