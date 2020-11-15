package uk.ac.gla.cvr.hoci;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.json.Json;
import javax.json.JsonObject;

import org.apache.commons.io.IOUtils;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModel;
import freemarker.template.TemplateModelException;
import uk.ac.gla.cvr.hoci.commandDoc.CommandDocument;
import uk.ac.gla.cvr.hoci.commandDoc.CommandDocumentJsonUtils;

public class FreemarkerDocTransformer {

	
	public static byte[] applyFreemarkerTemplate(File templatePath, File jsonPath) {
		String templateString;
		try(FileInputStream templateFileInputStream = new FileInputStream(templatePath)) {
			templateString = new String(IOUtils.toByteArray(templateFileInputStream), Charset.forName("UTF-8"));
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
		Template template = null;
		Configuration freemarkerConfiguration = new Configuration(Configuration.VERSION_2_3_24);
		template = FreemarkerUtils.templateFromString(templatePath.getName(), templateString, freemarkerConfiguration);
		
		String jsonString;
		try(FileInputStream jsonFileInputStream = new FileInputStream(jsonPath)) {
			jsonString = new String(IOUtils.toByteArray(jsonFileInputStream), Charset.forName("UTF-8"));
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
		JsonObject jsonObject = Json.createReader(new StringReader(jsonString)).readObject();
		CommandDocument cmdDoc = CommandDocumentJsonUtils.jsonObjectToCommandDocument(jsonObject);
		Map<String, Object> rootModel = initRootModel(cmdDoc, templatePath.getParentFile());
		return FreemarkerUtils.processTemplate(template, rootModel).getBytes();
		
	}
	

	private static Map<String, Object> initRootModel(CommandDocument commandDocument, File templateParentDir) {
		TemplateModel cmdDocModel = FreemarkerUtils.templateModelForObject(commandDocument);
		Map<String, Object> rootModel = new LinkedHashMap<String, Object>();
		rootModel.put("getResourceAsBase64", new GetResourceAsBase64Method(templateParentDir));
		rootModel.put("getResourceAsString", new GetResourceAsStringMethod(templateParentDir));
		rootModel.put(commandDocument.getRootName(), cmdDocModel);
		return rootModel;
	}

	public abstract static class GetResourceMethod implements TemplateMethodModelEx {
		private File templateParentDir;

	    public GetResourceMethod(File templateParentDir) {
			super();
			this.templateParentDir = templateParentDir;
		}
	    
		@SuppressWarnings("rawtypes")
		public final Object exec(List args) throws TemplateModelException {
	        if (args.size() != 1) {
	            throw new TemplateModelException("Wrong number of arguments");
	        }
	        String resourceFileName = args.get(0).toString();
			byte[] resourceFileBytes;
			try(FileInputStream fileInputStream = new FileInputStream(new File(templateParentDir, resourceFileName))) {
				resourceFileBytes = IOUtils.toByteArray(fileInputStream);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			return objectFromResourceFileBytes(resourceFileBytes);
	    }

		protected abstract Object objectFromResourceFileBytes(byte[] resourceFileBytes);
		

	}
	public static class GetResourceAsBase64Method extends GetResourceMethod{
	    public GetResourceAsBase64Method(File templateParentDir) {
			super(templateParentDir);
		}
	    @Override
	    protected Object objectFromResourceFileBytes(byte[] resourceFileBytes) {
	    	return new String(Base64.getEncoder().encode(resourceFileBytes));
	    }
	}
	public static class GetResourceAsStringMethod extends GetResourceMethod{
	    public GetResourceAsStringMethod(File templateParentDir) {
			super(templateParentDir);
		}
	    @Override
	    protected Object objectFromResourceFileBytes(byte[] resourceFileBytes) {
	    	return new String(resourceFileBytes);
	    }
	}

	
}
