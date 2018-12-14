package net.rossturner.imageuploader;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.IOUtils;
import spark.Spark;

import javax.servlet.MultipartConfigElement;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;


/**
 * Example resource class hosted at the URI path "/myresource"
 */
@Slf4j
public class ImageResource {

    public static void main(String[] args) {
        Spark.staticFiles.location("/public"); // Static files

        Spark.get("/api/image", (req, res) -> {
            res.type("text/plain");
            return "Hi there!";
        });

        Spark.post("/api/image", (req, res) -> {

            Integer value;

            try (InputStream is = req.raw().getInputStream()) {
                StringWriter writer = new StringWriter();
                IOUtils.copy(is, writer);
                String theString = writer.toString();
                value = theString.length();

                counter++;

                File of = new File("./image"+counter+".jpg");
                FileOutputStream osf = new FileOutputStream(of);
                try {
                    osf.write(Base64.decodeBase64(theString));
                    osf.flush();
                } finally {
                    osf.close();
                }

            }

            return Integer.toString(value);
        });
    }

	static int counter = 0;

}
