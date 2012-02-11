var Geometry = Geometry || {};

/**
 * Determines the point C on the line segment defined by points A and B which is
 * closest to the given point P. Returns C if the distance between P and C is within
 * tolerance. Returns false if distance between P and C is greater than tolerance.
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

/**
 * Calculates area of the triangle defined by the points ABC
 */
Geometry.areaOfTriangle = function(A,B,C) {
    return (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2
}

/**
 * Returns the left, right, top or bottom-most point in a list of points
 * Direction parameter specifies 'left', 'right', 'top' or 'bottom'
 */
Geometry.extrema = function(points, direction) {
    if (points.length > 0) {
        var most = points[0];
        if (points.length == 1) {
            return most;
        } else {
            for (var i=1; i<points.length; ++i) {
                var condition = false;
                if (direction == 'left') {
                    condition = points[i].x < most.x;
                } else if (direction == 'right') {
                    condition = points[i].x > most.x;
                } else if (direction == 'top') {
                    condition = points[i].y < most.y;
                } else if (direction == 'bottom') {
                    condition = points[i].y > most.y;
                }
                if (condition) {
                    most = points[i];
                }
            }
            return most;
        }
    }
}

/** 
 * Returns true if points are on the same line
 */
Geometry.onSameLine = function(points) {
    if (points.length > 0) {
        if (points.length < 3) {
            return true;
        } else {
            var result = true;
            for (var i=2; i<points.length; ++i) {
                if (Geometry.areaOfTriangle(points[i],points[i-1],points[i-2]) != 0) {
                    result = false;
                    break;
                }
            }
            return result;
        }
    }
}
