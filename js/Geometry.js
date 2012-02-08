var Geometry = Geometry || {};

/**
 * Determines the point on the line segment closest to the given point.
 */
Geometry.getClosestPointOnLineSegment = function(A, B, P, tolerance) {
    var a_to_p = [P.x - A.x, P.y - A.y];     // Storing vector A->P
    var a_to_b = [B.x - A.x, B.y - A.y];    // Storing vector A->B

    var atb2 = Math.pow(a_to_b[0],2) + Math.pow(a_to_b[1],2);  // Find the squared magnitude of a_to_b

    var atp_dot_atb = a_to_p[0]*a_to_b[0] + a_to_p[1]*a_to_b[1]; // The dot product of a_to_p and a_to_b

    var t = atp_dot_atb / atb2; // The normalized "distance" from a to your closest point

    var C = { x: A.x + a_to_b[0]*t, y: A.y + a_to_b[1]*t } // Add the distance to A, moving towards B
    
    //is distance between P (original point) and C (closest point on line segment) within tolerance?
    if (Geometry.distance(P,C) > tolerance) {
        return false;
    }
    
    //point is (approximately) on the line but is it within the line segment?
    //determine extrema of the line segment
    var minX = Math.min(A.x, B.x);
    var minY = Math.min(A.y, B.y);
    var maxX = Math.max(A.x, B.x);
    var maxY = Math.max(A.y, B.y);
    if (   (C.x >= minX || minX - C.x < tolerance)
        && (C.y >= minY || minY - C.y < tolerance)
        && (C.x <= maxX || C.x - maxX < tolerance)
        && (C.y <= maxY || C.y - maxY < tolerance)) {
        return C;
    } else {
        return false;
    }
}

Geometry.distance = function(A, B) {
    return Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
}