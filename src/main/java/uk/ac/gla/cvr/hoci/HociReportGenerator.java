package uk.ac.gla.cvr.hoci;

import java.io.File;
import java.io.FileOutputStream;

import org.apache.commons.io.IOUtils;

public class HociReportGenerator {

	public static void main(String[] args) throws Exception {
		if(args.length != 3) {
			System.err.println("Usage: hociReportGenerator.sh <templatePath> <inputJsonPath> <outputHtmlPath>");
			System.exit(1);
		}
		File templatePath = new File(args[0]);
		File inputJsonPath = new File(args[1]);
		byte[] outputHtmlBytes = FreemarkerDocTransformer.applyFreemarkerTemplate(templatePath, inputJsonPath);
		try(FileOutputStream outputStream = new FileOutputStream(new File(args[2]))) {
			IOUtils.write(outputHtmlBytes, outputStream);
		}
	}
}

